(function() {
	'use strict';

	angular.module('onyxCommon').service('NxApiService', NxApiService);

	/** @ngInject */
	function NxApiService($http, $q, $location, appConfig, APP_CONSTANT) { // jshint
																			// ignore:line
		var service = {};

		service.callLocalService = function(serviceName, callMethod, payload) {
			return service
					._callService(serviceName, callMethod, payload, false);
		};

		service.callService = function(serviceName, callMethod, payload,
				isPrivate, contentType) {

			if (APP_CONSTANT.API_CONFIG.ENABLE_MOCK_MODE) {
				$http.defaults.headers.common.Authorization = 'MOCK_MODE';
				return service._callService(serviceName, callMethod, payload,
						false, isPrivate, contentType);
			} else {
				return service._callService(serviceName, callMethod, payload,
						true, isPrivate, contentType);
			}
		};

		service._callService = function(serviceName, callMethod, payload,
				isRemote, isPrivate, contentType) {
			var deferred = $q.defer();
			var apiLocation = _createURL(serviceName, callMethod, isRemote,
					isPrivate);

			// IE cache Ajax calls. appending current date and time will burst
			// the cache
			apiLocation = apiLocation + '?t=' + new Date().getTime();

			if (APP_CONSTANT.API_CONFIG.ENABLE_MOCK_MODE) {
				callMethod = 'GET';// all mock are simulated as GET
			}

			if (contentType) {
				$http.defaults.headers.put["Content-Type"] = contentType;
			} else {// default should be JSON
				$http.defaults.headers.put["Content-Type"] = "application/json";
			}

			$http.defaults.headers.put['Cache-Control'] = 'no-cache';
			$http.defaults.headers.put['Pragma'] = 'no-cache';

			$http({
				method : callMethod,
				url : apiLocation,
				data : payload
			}).then(function(success) {
				var responseHeaders = _headersGetter(success.headers);

				if (responseHeaders) {
					var newToken = success.headers('authorization');
					if (newToken) {
						appConfig.TOKEN = newToken;
						$http.defaults.headers.common.Authorization = newToken;
					}
				}
				deferred.resolve(success);
			}, function(fail) {
            	var failOutputBase = fail.data;
            	appConfig.message =  failOutputBase.errors[0].message;
            	appConfig.errorCode =  failOutputBase.errors[0].code;
				deferred.reject(fail);
			});
			return deferred.promise;
		};

		var _headersGetter = function(headers) {
			var headersObj;

			return function(name) {
				if (!headersObj)
					headersObj = parseHeaders(headers);// jshint ignore:line

				if (name) {
					var value = headersObj[angular.lowercase(name)];
					if (value === void 0) {
						value = null;
					}
					return value;
				}

				return headersObj;
			}
		};

		var _createURL = function(serviceName, callMethod, isRemote, isPrivate) {
			var apiLocation = "";

			if (!isRemote) {
				apiLocation = $location.protocol() + '://';
				apiLocation = apiLocation + $location.host();
				apiLocation = apiLocation + ':' + $location.port();
				// if Backendless mode use the data dir
				if (APP_CONSTANT.API_CONFIG.ENABLE_MOCK_MODE) {
					if ($location.host() === 'localhost') {
						apiLocation = apiLocation + '/data/rest' + serviceName
								+ '.' + angular.lowercase(callMethod) + '.json';
					} else { // remote
						apiLocation = apiLocation
								+ APP_CONSTANT.API_CONFIG.MOCK_API_APP
								+ '/data/rest' + serviceName + '.'
								+ angular.lowercase(callMethod) + '.json';
					}
				} else {
					apiLocation = apiLocation + serviceName;
				}
				return apiLocation;
			}

			apiLocation = service.getApiServerUrl();
			if (APP_CONSTANT.API_CONFIG.APP_ENDPOINT) {
				apiLocation = apiLocation
						+ APP_CONSTANT.API_CONFIG.APP_ENDPOINT;
			}

			if (APP_CONSTANT.API_CONFIG.ENABLE_MOCK_MODE || isPrivate) {
				apiLocation = apiLocation + serviceName;
			} else {
				apiLocation = apiLocation + '/public' + serviceName;
			}

			return apiLocation;
		};

		service.getApiServerUrl = function() {
			var apiLocation = $location.protocol() + '://';
			$http.defaults.headers.common.Authorization = appConfig.TOKEN;

			if (APP_CONSTANT.API_CONFIG.SERVER) {
				apiLocation = apiLocation + APP_CONSTANT.API_CONFIG.SERVER;
			} else {
				apiLocation = apiLocation + $location.host();
			}

			if (($location.host() === 'localhost')
					&& APP_CONSTANT.API_CONFIG.APP_URL_PORT) {
				apiLocation = apiLocation + ':'
						+ APP_CONSTANT.API_CONFIG.APP_URL_PORT;
			} else if ($location.port() !== '80' && $location.port() !== '443') {
				apiLocation = apiLocation + ':' + $location.port();
			}

			if (APP_CONSTANT.API_CONFIG.API_APP) {
				apiLocation = apiLocation + APP_CONSTANT.API_CONFIG.API_APP;
			}

			return apiLocation;
		};
		return service;
	}
})();