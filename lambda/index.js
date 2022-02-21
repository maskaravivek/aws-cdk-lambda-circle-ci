"use strict"

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
var fs = require('fs');
const {stringify} = require('csv-stringify');
AWS.config.update({ region: 'us-west-2' });

var ddb = new AWS.DynamoDB();
const s3 = new AWS.S3();

const TABLE_NAME = process.env.TABLE_NAME
const BUCKET_NAME = process.env.BUCKET_NAME

exports.handler = async function (event) {
    try {
        const uploadedObjectKey = generateDataAndUploadToS3()
        const jobId = event['jobId']
        var params = {
            TableName: TABLE_NAME,
            Item: {
                'jobId': { S: jobId },
                'reportFileName': { S: uploadedObjectKey }
            }
        };

        // Call DynamoDB to add the item to the table
        await ddb.putItem(params).promise();;
        return {
            "status": "success",
            "jobId": jobId,
            "objectKey": uploadedObjectKey
        }
    } catch (error) {
        throw Error(`Error in backend: ${error}`)
    }
}

const generateDataAndUploadToS3 = () => {
    var filePath = '/tmp/test_user_data.csv'
    const objectKey = `${uuidv4()}.csv`;
    writeCsvToFileAndUpload(filePath, objectKey)
    return objectKey
}

const uploadFile = (fileName, objectKey) => {
    // Read content from the file
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: fileContent
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
    });
    return objectKey;
};

function writeCsvToFileAndUpload(filePath, objectKey) {
    var data = getCsvData()
    stringify(data, function (err, output) {
        fs.writeFile(filePath, output);
    })
}

function getCsvData() {
    return {
        "users": [
            {
                "name": "Test 1",
                "age": "20"
            },
            {
                "name": "Test 2",
                "age": "24"
            }
        ]
    }
}
