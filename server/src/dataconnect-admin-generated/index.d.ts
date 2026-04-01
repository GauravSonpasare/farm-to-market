import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface AllCropListingsData {
  cropListings: ({
    id: UUIDString;
    cropName: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    location: string;
    status: string;
    description?: string | null;
    farmer: {
      username: string;
      farmName?: string | null;
    };
  } & CropListing_Key)[];
}

export interface CropListing_Key {
  id: UUIDString;
  __typename?: 'CropListing_Key';
}

export interface Image_Key {
  id: UUIDString;
  __typename?: 'Image_Key';
}

export interface MarketTrend_Key {
  id: UUIDString;
  __typename?: 'MarketTrend_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'AllCropListings' Query. Allow users to execute without passing in DataConnect. */
export function allCropListings(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<AllCropListingsData>>;
/** Generated Node Admin SDK operation action function for the 'AllCropListings' Query. Allow users to pass in custom DataConnect instances. */
export function allCropListings(options?: OperationOptions): Promise<ExecuteOperationResponse<AllCropListingsData>>;

