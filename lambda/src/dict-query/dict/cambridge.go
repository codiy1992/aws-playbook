package dict

import (
	"regexp"
	"strings"
	"time"

	"github.com/antchfx/htmlquery"
	"golang.org/x/net/html"
)

// Help Codes: https://dictionary.cambridge.org/us/help/codes.html
const CAMBRIDGE_URL = "https://dictionary.cambridge.org"

type Cambridge struct{}

func NewCambridge() *Cambridge {
	return &Cambridge{}
}

// prevent scaffold nephew interactive crying give-up at-any-cost
func (c Cambridge) Query(vocab string) []Vocabulary {
	doc, err := htmlquery.LoadURL(CAMBRIDGE_URL + "/us/dictionary/english/" + vocab)
	if err != nil {
		panic(err)
	}
	dictionaries, err := htmlquery.QueryAll(doc, `//div[@class="pr dictionary"]`)
	if err != nil {
		panic(err)
	}
	var result []Vocabulary
	for _, dictionary := range dictionaries {
		Vocabulary := Vocabulary{}
		Vocabulary.Word = vocab
		Vocabulary.Version = Version
		Vocabulary.Date = time.Now().Format("2006-01-02")

		// dictionary
		Vocabulary.Dictionary = "Cambridge Advanced Learner's Dictionary & Thesaurus"
		dictName, _ := htmlquery.Query(
			dictionary, `//div[@class="di-title di_t"]/h2[contains(., "Intermediate")]`,
		)
		if dictName != nil {
			Vocabulary.Dictionary = "Cambridge Academic Content Dictionary(Intermediate English)"
		} else {
			dictName, _ := htmlquery.Query(
				dictionary, `//div[@class="di-title di_t"]/h2[contains(., "Business")]`,
			)
			if dictName != nil {
				Vocabulary.Dictionary = "Cambridge Business English Dictionary"
			}
		}

		// entries
		entries, _ := htmlquery.QueryAll(
			dictionary, `//div[@class="entry-body"]/div[contains(@class, "entry-body__el")]`,
		)
		for _, entry := range entries {
			Vocabulary.Entries = append(Vocabulary.Entries, c.ParseEntry(entry, false))
		}

		// idiom
		if entries == nil {
			idioms, _ := htmlquery.QueryAll(dictionary, `//div[@class="idiom-block"]`)
			for _, idiom := range idioms {
				Vocabulary.Entries = append(Vocabulary.Entries, c.ParseEntry(idiom, true))
			}
		}

		result = append(result, Vocabulary)
	}
	return result
}

func (c Cambridge) ParseEntry(node *html.Node, isIdiom bool) Entry {
	Entry := Entry{}
	Entry.IsIdiom = isIdiom
	// word
	word, _ := htmlquery.Query(node, `//div[@class="di-title"]//.[contains(@class, "headword")]`)
	if word != nil {
		Entry.Word = strings.Trim(htmlquery.InnerText(word), " ")
	}

	// part of speech
	partOfSpeechs, _ := htmlquery.QueryAll(
		node, `//div[contains(@class, "pos-header")]//span[@class="pos dpos"]`,
	)
	for _, partOfSpeech := range partOfSpeechs {
		Entry.PartOfSpeechs = append(
			Entry.PartOfSpeechs,
			strings.Trim(htmlquery.InnerText(partOfSpeech), " "),
		)
	}

	// part of speech label
	posLabels, _ := htmlquery.QueryAll(
		node, `//div[contains(@class, "pos-header")]//span[@class="gram dgram"]/a/span`,
	)
	for _, posLabel := range posLabels {
		value := strings.Trim(htmlquery.InnerText(posLabel), " ")
		Entry.POSLabels = append(
			Entry.POSLabels,
			"["+value+"]",
		)
	}

	// pronunciations
	Entry.Pronunciations = c.ParsePronuns(node)

	// definitions
	definitions, _ := htmlquery.QueryAll(node, `//div[@class="pos-body"]`)
	for _, definition := range definitions {
		Entry.Definitions = append(Entry.Definitions, c.ParseDefinition(definition))
	}

	// examples
	examples, _ := htmlquery.QueryAll(
		node,
		`//div[contains(@class, "sense-body")]/div[@class="daccord"]//section/ul/li[@class="eg dexamp hax"]`,
	)
	for _, example := range examples {
		Entry.Examples = append(
			Entry.Examples, strings.Trim(htmlquery.InnerText(example), " "),
		)
	}
	return Entry
}

func (c Cambridge) ParsePronuns(node *html.Node) map[string]Pronunciation {
	result := make(map[string]Pronunciation)

	ipaUs, _ := htmlquery.Query(
		node, `//span[@class="us dpron-i "][1]//span[contains(@class, "ipa")]`,
	)
	if ipaUs != nil {
		Pronunciation := Pronunciation{}
		Pronunciation.Ipa = htmlquery.InnerText(ipaUs)

		audio_mp3, _ := htmlquery.Query(
			node, `//span[@class="us dpron-i "][1]//source[@type="audio/mpeg"]`,
		)
		if audio_mp3 != nil {
			Pronunciation.Mp3 = CAMBRIDGE_URL + htmlquery.SelectAttr(audio_mp3, "src")
		}
		audio_ogg, _ := htmlquery.Query(
			node, `//span[@class="us dpron-i "][1]//source[@type="audio/ogg"]`,
		)
		if audio_ogg != nil {
			Pronunciation.Ogg = CAMBRIDGE_URL + htmlquery.SelectAttr(audio_ogg, "src")
		}
		result["us"] = Pronunciation
	}

	ipaUk, _ := htmlquery.Query(
		node, `//span[@class="uk dpron-i "][1]//span[contains(@class, "ipa")]`,
	)
	if ipaUk != nil {
		Pronunciation := Pronunciation{}
		Pronunciation.Ipa = htmlquery.InnerText(ipaUk)
		audio_mp3, _ := htmlquery.Query(
			node, `//span[@class="uk dpron-i "][1]//source[@type="audio/mpeg"]`,
		)
		if audio_mp3 != nil {
			Pronunciation.Mp3 = CAMBRIDGE_URL + htmlquery.SelectAttr(audio_mp3, "src")
		}
		audio_ogg, _ := htmlquery.Query(
			node, `//span[@class="uk dpron-i "][1]//source[@type="audio/ogg"]`,
		)
		if audio_ogg != nil {
			Pronunciation.Ogg = CAMBRIDGE_URL + htmlquery.SelectAttr(audio_ogg, "src")
		}
		result["uk"] = Pronunciation
	}
	return result
}

func (c Cambridge) ParseDefinition(node *html.Node) Definition {
	Definition := Definition{}
	// definition
	definition, _ := htmlquery.Query(node, `//div[@class="def ddef_d db"]`)
	if definition != nil {
		Definition.Definition = strings.Trim(htmlquery.InnerText(definition), ": ") + "."
	}

	// images
	images, _ := htmlquery.QueryAll(node, `//div[@class="dimg"]//amp-img`)
	re := regexp.MustCompile(`(?mi)src:\s*'([^']+)'`)
	for _, image := range images {
		image := htmlquery.SelectAttr(image, "on")
		matchs := re.FindStringSubmatch(image)
		if len(matchs) > 1 {
			Definition.Images = append(Definition.Images, CAMBRIDGE_URL+matchs[1])
		}
	}

	// examples
	examples, _ := htmlquery.QueryAll(node, `//div[@class="examp dexamp"]`)
	for _, example := range examples {
		value := strings.Trim(htmlquery.InnerText(example), " ")
		value = strings.Replace(value, "[ ", "[", 1)
		value = strings.Replace(value, " ]", "]", 1)
		Definition.Examples = append(Definition.Examples, value)
	}

	// thesaurus
	thesaurus, _ := htmlquery.QueryAll(
		node, `//section//div[@class="daccord_lb"]//ul/li[@class="had t-i"]`,
	)
	for _, thes := range thesaurus {
		Thesaurus := Thesaurus{}
		word, _ := htmlquery.Query(thes, `//a`)
		example, _ := htmlquery.Query(thes, `//span[@class="example dexample"]`)
		if word != nil && example != nil {
			Thesaurus.Word = strings.Trim(htmlquery.InnerText(word), " ")
			Thesaurus.Example = strings.Trim(htmlquery.InnerText(example), " ")
			Definition.Thesauruses = append(Definition.Thesauruses, Thesaurus)
		}
	}
	return Definition
}
