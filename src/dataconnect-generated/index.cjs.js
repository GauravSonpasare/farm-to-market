const { queryRef, executeQuery, validateArgsWithOptions, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'farm',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const allCropListingsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AllCropListings');
}
allCropListingsRef.operationName = 'AllCropListings';
exports.allCropListingsRef = allCropListingsRef;

exports.allCropListings = function allCropListings(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(allCropListingsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;
