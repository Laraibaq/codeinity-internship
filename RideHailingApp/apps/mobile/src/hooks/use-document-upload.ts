import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

import { apiClient, getApiErrorMessage } from "@/lib/api-client";

// Matches the backend's DocumentType enum exactly (apps/backend/src/drivers/dto/upload-document.dto.ts).
export type DocumentType =
  | "profile_photo"
  | "identity_document"
  | "license_front"
  | "license_back"
  | "vehicle_registration"
  | "vehicle_insurance"
  | "vehicle_photo_front"
  | "vehicle_photo_side"
  | "vehicle_photo_back"
  | "vehicle_photo_interior";

interface UseDocumentUploadResult {
  // The picked image's local URI, shown immediately as a thumbnail/preview -- set as soon as a
  // photo is picked, independent of whether the upload itself has finished yet.
  uri: string | null;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
  pickFromLibrary: () => Promise<void>;
  pickFromCamera: () => Promise<void>;
}

// Shared by every document/photo upload screen (profile photo, identity document, license
// front/back, the 4 vehicle photos, vehicle registration/insurance): request the relevant
// permission, launch the picker, then POST the result to /drivers/me/documents with the given
// documentType, using the shared api-client's stored access token.
export function useDocumentUpload(documentType: DocumentType): UseDocumentUploadResult {
  const [uri, setUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = async (source: "library" | "camera") => {
    setError(null);

    const permission =
      source === "library"
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(
        source === "library"
          ? "Photo library access is needed to pick a photo."
          : "Camera access is needed to take a photo.",
      );
      return;
    }

    const result =
      source === "library"
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", quality: 0.8 })
        : await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: 0.8 });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    setUri(asset.uri);
    setUploaded(false);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      // React Native's FormData accepts this { uri, name, type } shape for a file part -- it
      // isn't a real DOM Blob/File, which is why the cast is needed against FormData's DOM typings.
      formData.append(
        "file",
        {
          uri: asset.uri,
          name: asset.fileName ?? `${documentType}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        } as unknown as Blob,
      );

      // No explicit Content-Type here -- letting axios/RN generate the multipart boundary itself.
      // Setting "multipart/form-data" manually would override that and omit the boundary, which
      // the server needs to parse the body at all.
      await apiClient.post("/drivers/me/documents", formData);
      setUploaded(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Upload failed. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  return {
    uri,
    uploading,
    uploaded,
    error,
    pickFromLibrary: () => pickAndUpload("library"),
    pickFromCamera: () => pickAndUpload("camera"),
  };
}
