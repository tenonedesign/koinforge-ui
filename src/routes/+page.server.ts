
// this file runs on server only, so it contains code not suitable for +page.ts since the runs on server and client
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import fs from "fs";

export async function load({ params }) {
  return {
    contractWasmBase64: fs.readFileSync("src/lib/fogata.wasm").toString("base64"),
    nodes: getNodes()
  };
}

async function setNodes() {
  const client = new SecretManagerServiceClient();
  const projectId = "fogata-371923";
  const secretId = "koinos-nodes";
  const [accessResponse] = await client.accessSecretVersion({
    name: 'latest',
  });
}

async function getNodes() {
  if (true) {
    return [
      {
        "owner": "1JUukHhhVrDLtJFTTFA32rEtYyyWo7JenE",
        "private_key": "5HwLNJ1FhmCLUCk6Nqo3Uc8vST9pu41Q7hjLv57Jdde4hASfeg9",
        "public_key": "A7ntFKQqnKGt6TDJX8MsGtByPmHjOSTeiPylB39JunML",
        "producer": "19JntSm8pSNETT9aHTwAUHC5RMoaSmgZPJ",
        "approve_proposals": [
          "0x12202ccb63072165456905399240e2d0beecf84868b5b337456c7e54d7789d259692",
          "0x22202ccb63072165456905399240e2d0beecf84868b5b337456c7e54d7789d259692",
          "0x32202ccb63072165456905399240e2d0beecf84868b5b337456c7e54d7789d259692"
        ],
        "enabled": true
      },
      {
        "owner": "1JUukHhhVrDLtJFTTFA32rEtYyyWo7JenE",
        "private_key": "5JADCvEEUKNG25xcEoXaXQe47HFF5L76Um2FV54P1iJnSRoZRzE",
        "public_key": "A5A_b5q42cWv_eixTLzft3DdBZcHpw6B9amx0L4DLmOz",
        "producer": "198RuEouhgiiaQm7uGfaXS6jqZr6g6nyoR",
        "approve_proposals": [
          "0x22202ccb63072165456905399240e2d0beecf84868b5b337456c7e54d7789d259692"
        ],
        "enabled": true
      }
    ];
  }
  return JSON.parse(fs.readFileSync("/run/secrets/koinos-nodes/koinos-nodes").toString("utf-8"));
}