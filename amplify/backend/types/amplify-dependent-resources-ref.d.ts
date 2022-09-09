export type AmplifyDependentResourcesAttributes = {
    "auth": {
        "socialsensingf07a871c": {
            "IdentityPoolId": "string",
            "IdentityPoolName": "string",
            "UserPoolId": "string",
            "UserPoolArn": "string",
            "UserPoolName": "string",
            "AppClientIDWeb": "string",
            "AppClientID": "string",
            "CreatedSNSRole": "string"
        },
        "userPoolGroups": {
            "metofficeGroupRole": "string",
            "demoGroupRole": "string",
            "socialsensingGroupRole": "string",
            "testuserGroupRole": "string",
            "cypressAGroupRole": "string",
            "cypressBGroupRole": "string"
        }
    },
    "function": {
        "S3Triggerb3a090e2": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "query": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "twitterCompliance": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string",
            "CloudWatchEventRule": "string"
        },
        "api": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string"
        },
        "sqsquery": {
            "Name": "string",
            "Arn": "string",
            "Region": "string",
            "LambdaExecutionRole": "string",
            "lambdaexecutionpolicy": "string"
        }
    },
    "storage": {
        "jsonstorage": {
            "BucketName": "string",
            "Region": "string"
        }
    },
    "api": {
        "socialsensing": {
            "GraphQLAPIIdOutput": "string",
            "GraphQLAPIEndpointOutput": "string"
        },
        "query": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        },
        "api": {
            "RootUrl": "string",
            "ApiName": "string",
            "ApiId": "string"
        }
    },
    "custom": {
        "querySQS": {
            "Name": "string",
            "Arn": "string",
            "Region": "string"
        }
    }
}