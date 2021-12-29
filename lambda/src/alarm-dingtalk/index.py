# -*- coding: utf-8 -*-
import json
import os
import urllib3

"""
event data
{
    "Records": [
        {
            "EventVersion": "1.0",
            "EventSubscriptionArn": "xxxxx",
            "EventSource": "aws:sns",
            "Sns": {
                "SignatureVersion": "1",
                "Timestamp": "2020-05-07T01:39:39.535Z",
                "Signature": "xxxxx",
                "SigningCertUrl": "xxxxx",
                "MessageId": "e5e38b9d-093c-500a-aef6-dcb060279449",
                "Message": "json data",
                "MessageAttributes": {},
                "Type": "Notification",
                "UnsubscribeUrl": "xxxx",
                "TopicArn": "xxxx",
                "Subject": "Subject"
            }
        }
    ]
}
"""
def handler(event, context):
    ding_token = os.getenv('DING_TOKEN')
    region = os.getenv('REGION')
    message = event['Records'][0]['Sns']
    subject = message['Subject']
    timestamp = message['Timestamp']
    alarm = json.loads(message['Message'])

    if alarm['AlarmDescription'] == None :
        details = '无'
    else:
        details =  alarm['AlarmDescription']
    alarm_name = alarm['AlarmName']
    title = "-" * 12 + "告警信息" + "-" * 12
    url = 'https://' + region +'.console.amazonaws.cn/cloudwatch/home?region=' + region + '#alarmsV2:alarm/'
    url += alarm_name
    # 消息拼接
    content = ""
    content += " ".join([title, "\n"])
    content += " ".join([subject, "\n"])
    content += " ".join(["告警时间:", timestamp, "\n"])
    content += " ".join(["描述信息:", details, "\n"])
    content += " ".join(["详情查看:", url])

    http = urllib3.PoolManager()
    request = http.request('POST',
        "https://oapi.dingtalk.com/robot/send?access_token=" + ding_token,
        body = json.dumps({
                "msgtype": "text",
                "text": {
                    "content": content
                }
            }),
        headers={'Content-Type': 'application/json'})

    return request.text
