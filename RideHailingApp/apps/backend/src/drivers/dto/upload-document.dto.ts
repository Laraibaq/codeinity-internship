import { IsEnum } from 'class-validator';

export enum DocumentType {
  profile_photo = 'profile_photo',
  identity_document = 'identity_document',
  license_front = 'license_front',
  license_back = 'license_back',
  vehicle_registration = 'vehicle_registration',
  vehicle_insurance = 'vehicle_insurance',
  vehicle_photo_front = 'vehicle_photo_front',
  vehicle_photo_side = 'vehicle_photo_side',
  vehicle_photo_back = 'vehicle_photo_back',
  vehicle_photo_interior = 'vehicle_photo_interior',
}

export class UploadDocumentDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;
}
