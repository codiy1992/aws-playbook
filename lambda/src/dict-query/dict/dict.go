package dict

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
)

const Version = "2022.03.27.1"

type Vocabulary struct {
	Dictionary string  `json:"dictionary"`
	Word       string  `json:"word"`
	Entries    []Entry `json:"entries"`
	Version    string  `json:"version"`
	Date       string  `json:"date"`
}

type Entry struct {
	Word           string                   `json:"word"`
	IsIdiom        bool                     `json:"isIdiom"`
	PartOfSpeechs  []string                 `json:"partOfSpeechs"`
	POSLabels      []string                 `json:"posLabels"`
	Pronunciations map[string]Pronunciation `json:"pronunciations"`
	Definitions    []Definition             `json:"definitions"`
	Examples       []string                 `json:"examples"`
}

type Pronunciation struct {
	Ipa string `json:"ipa"`
	Mp3 string `json:"mp3"`
	Ogg string `json:"ogg"`
}

type Definition struct {
	Definition  string      `json:"definition"`
	Images      []string    `json:"images"`
	Examples    []string    `json:"examples"`
	Thesauruses []Thesaurus `json:"thesauruses"`
}

type Thesaurus struct {
	Word    string `json:"word"`
	Example string `json:"example"`
}

func Query(word string) interface{} {
	data := NewCambridge().Query(word)
	word = strings.ReplaceAll(strings.ToLower(word), " ", "-")
	uploadToS3(word, data, dictMedias(word, data))
	return data
}

func dictMedias(word string, data []Vocabulary) map[string]string {
	medias := make(map[string]string)
	for i, vocab := range data {
		for j, entry := range vocab.Entries {
			// Audios
			for k, audio := range entry.Pronunciations {
				if audio.Ogg != "" {
					_, exists := medias[audio.Ogg]
					if !exists {
						medias[audio.Ogg] = fmt.Sprintf(
							"dictionary/cambridge/"+word[:2]+"/"+word+"/%s-%d%d.ogg", k, i, j,
						)
					}
					audio.Ogg = medias[audio.Ogg]
				}
				if audio.Mp3 != "" {
					_, exists := medias[audio.Mp3]
					if !exists {
						medias[audio.Mp3] = fmt.Sprintf(
							"dictionary/cambridge/"+word[:2]+"/"+word+"/%s-%d%d.mp3", k, i, j,
						)
					}
					audio.Mp3 = medias[audio.Mp3]
				}
				entry.Pronunciations[k] = audio
			}
			// Images
			for m, definition := range entry.Definitions {
				for n, image := range definition.Images {
					s := strings.Split(strings.Join(strings.Split(image, "?")[:1], ""), ".")
					suffix := strings.ToLower(strings.Join(s[len(s)-1:], ""))
					_, exists := medias[image]
					if !exists {
						medias[image] = fmt.Sprintf(
							"dictionary/cambridge/"+word[:2]+"/"+word+"/%d%d%d%d.%s", i, j, m, n, suffix,
						)
					}
					definition.Images[n] = medias[image]
				}
			}
		}
	}
	return medias
}

func uploadToS3(word string, data []Vocabulary, medias map[string]string) {

	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		log.Fatal(err)
	}

	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.Region = "ap-southeast-1"
	})

	var wg sync.WaitGroup
	wg.Add(len(medias) + 1)

	for key, value := range medias {
		go func(url string, oKey string) {
			defer wg.Done()
			resp, err := http.Get(url)
			if err != nil {
				panic(err)
			}
			defer resp.Body.Close()

			bodyBytes, _ := ioutil.ReadAll(resp.Body)
			contentTypes, exists := resp.Header["Content-Type"]
			if !exists {
				panic("Content-Type not found")
			}
			_, err = client.PutObject(context.TODO(), &s3.PutObjectInput{
				Bucket:      aws.String("s3.codiy.net"),
				Key:         aws.String(oKey),
				ACL:         types.ObjectCannedACLPublicRead,
				Body:        bytes.NewReader(bodyBytes),
				ContentType: aws.String(contentTypes[0]),
			})
			if err != nil {
				panic(err)
			}
		}(key, value)

	}
	jsonData, _ := json.Marshal(data)
	go func() {
		defer wg.Done()
		_, err := client.PutObject(context.TODO(), &s3.PutObjectInput{
			Bucket:      aws.String("s3.codiy.net"),
			Key:         aws.String("dictionary/cambridge/" + word[:2] + "/" + word + "/data.json"),
			ACL:         types.ObjectCannedACLPublicRead,
			Body:        bytes.NewReader(jsonData),
			ContentType: aws.String("application/json"),
		})
		if err != nil {
			fmt.Println(err)
		}
	}()
	wg.Wait()
}
