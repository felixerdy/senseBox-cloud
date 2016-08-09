# How to use with Amazon Web Services

1. Create AWS Account
2. Create S3 Bucket
3. Add Policy to allow Upload to this Bucket (http://docs.aws.amazon.com/AmazonS3/latest/dev/example-bucket-policies.html)
4. In server.js add your bucket name in s3BucketName 
5. Create AWS Lambda Function (Node.js) (512MB)
6. Upload Archiv.zip 
7. At Configuration Tab, type `server.handler` in handler
8. At Trigger Tab, add a new Trigger
9. Choose an API-Gateway Trigger
10. Choose a name and create the Trigger
11. At API-Gateway console, create a new Model
12. The model can look like this:
```
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "senseBoxCloudModel",
  "type": "object",
  "properties": {
    "image": { "type": "string" },
    "senseBox_ID": { "type": "string" },
    "sensor_ID": { "type": "string" },
    "timestamp": { "type": "string" }
  }
}
```
13. Save the Model
14. At the created API-Endpoint, choose the created Model as a Request Model
15. Paste the Trigger-URL as serverURL in the Raspberry Pi Code
16. ???
17. Run your Raspberry Pi Code and watch the Logs at AWS CloudWatch
