(function () {
    'use strict';

    angular.module('onyxCommon').service('LogoutService', LogoutService);

    /** @ngInject */
    function LogoutService($http, appConfig) { // jshint ignore:line
        var service = {};

        service.reset = function () {
            //remove all persistent data
            $http.defaults.headers.common['Authorization'] = '';// jshint ignore:line
            appConfig.TOKEN = '';
            localStorage.setItem('Authorization', '');
        };

        service.init = function () {
            //this._initPropertyList();
        };

        return service;
    }
})();
