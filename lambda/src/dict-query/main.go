package main

import (
	"dict/dict"
	"dict/events"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
)

type Query struct {
	Word string
}

// TODO use aws-lambda-go SDK event struct
func LambdaHandler(request events.LambdaFunctionURLRequest) (string, error) {
	query := Query{}
	var exists bool
	if query.Word, exists = request.QueryStringParameters["word"]; !exists {
		if err := json.NewDecoder(strings.NewReader(request.Body)).Decode(&query); err != nil {
			panic(`{"code": 422, "message": "parameters error"}`)
		}
	}
	jsonData, _ := json.Marshal(dict.Query(query.Word))
	return string(jsonData), nil
}

func main() {
	lambda.Start(LambdaHandler)
}
