import { AllCropListingsData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAllCropListings(options?: useDataConnectQueryOptions<AllCropListingsData>): UseDataConnectQueryResult<AllCropListingsData, undefined>;
export function useAllCropListings(dc: DataConnect, options?: useDataConnectQueryOptions<AllCropListingsData>): UseDataConnectQueryResult<AllCropListingsData, undefined>;
