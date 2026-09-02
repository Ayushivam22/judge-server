import "dotenv/config";
import { promises as fs } from "fs";
import {
    S3Client,
    GetObjectCommand
} from "@aws-sdk/client-s3";

if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION is not defined");
}
const S3 = new S3Client({
    region: process.env.AWS_REGION
});
export default S3;