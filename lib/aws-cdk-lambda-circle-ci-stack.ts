import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import { Duration } from "@aws-cdk/core";

export class AwsCdkLambdaCircleCiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const circleCiGwpBucket = new s3.Bucket(this, "circle-ci-gwp-bucket", {
      bucketName: "circle-ci-gwp",
      publicReadAccess: true,
    });

    const circleCiGwpTable = new dynamodb.Table(this, "CircleCIGwpTable", {
      tableName: "CircleCIGwpTable",
      partitionKey: { name: "jobId", type: dynamodb.AttributeType.STRING },
    });

    const circleCiGwpLambda = new lambda.Function(
      this,
      "CircleCiGwpLambda",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        handler: "index.handler",
        timeout: Duration.seconds(30),
        code: lambda.Code.fromAsset("lambda/"),
        environment: {
          TABLE_NAME: circleCiGwpTable.tableName,
          BUCKET_NAME: circleCiGwpBucket.bucketName
        },
      }
    );

    circleCiGwpTable.grantReadWriteData(circleCiGwpLambda);
    circleCiGwpBucket.grantPut(circleCiGwpLambda)
  }
}
