const { validateAdminArgs } = require('firebase-admin/data-connect');

const connectorConfig = {
  connector: 'example',
  serviceId: 'farm',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

function allCropListings(dcOrOptions, options) {
  const { dc: dcInstance, options: inputOpts} = validateAdminArgs(connectorConfig, dcOrOptions, options, undefined);
  dcInstance.useGen(true);
  return dcInstance.executeQuery('AllCropListings', undefined, inputOpts);
}
exports.allCropListings = allCropListings;

