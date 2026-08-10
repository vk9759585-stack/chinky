exports.getSettingsMetadata = async (req, res) => {
  res.json({
    appName: 'Chinky',
    settingsVersion: 32,
    supportCategories: ['Account','Privacy and user safety','Posts','LIVE','Using Chinky','Monetisation','Other'],
    features: { dataSaver: true, freeUpSpace: true, helpCentre: true, termsAndPolicies: true }
  });
};
