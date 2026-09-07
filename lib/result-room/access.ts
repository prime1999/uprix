import { google } from "googleapis";

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  return google.drive({
    version: "v3",
    auth,
  });
}

export async function grantResultRoomDriveAccess(
  folderId: string,
  userEmail: string,
) {
  const drive = getDriveClient();

  const response = await drive.permissions.create({
    fileId: folderId,
    requestBody: {
      type: "user",
      role: "reader",
      emailAddress: userEmail,
    },
    sendNotificationEmail: true,
    fields: "id",
  });

  return response.data;
}
