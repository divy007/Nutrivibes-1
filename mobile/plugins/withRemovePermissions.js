const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withRemovePermissions(config) {
    return withAndroidManifest(config, (config) => {
        config.modResults.manifest['uses-permission'] = config.modResults.manifest['uses-permission'].filter(
            (permission) => {
                const name = permission.$['android:name'];
                return (
                    name !== 'android.permission.READ_EXTERNAL_STORAGE' &&
                    name !== 'android.permission.WRITE_EXTERNAL_STORAGE'
                );
            }
        );
        return config;
    });
};
