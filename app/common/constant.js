global["WORKSPACE_DB"] = "db_workspace";
global["USER_DB"] = "db_user";
global["CONFIG_DB"] = "db_config";
global["TOKEN_DB"] = "db_token";

/*--------------- API name -----------------*/
global["API_AUTHENTICATE"] = "TA.Auth/api/v1/ClockAuth/login";
global["API_VALIDATE_EMPLOYEE"] = "TA.Clock/api/v1/Employee/ValidateEmployee";
global["API_PUNCH"] = "TA.Clock/api/v1/Punches/Punches";
global["API_CONFIGURATION"] = "TA.Clock/api/v1/Configuration/ClockConfiguration";
global["API_GET_LEVELS"] = "TA.Clock/api/v1/Configuration/LevelCodes";
global["API_GET_LEVEL_HIERARCHY_PLANS"] = "TA.Clock/api/v1/Configuration/LevelHierarchyPlans";
global["API_GET_QUESTION"] = "TA.Clock/api/v1/Punches/GetAttestationQuestions";
global["API_GET_QUESTION"] = "TA.Clock/api/v1/Punches/GetAttestationQuestions";
global["API_PTO_REQUEST"] ="TA.Clock/api/v1/Employee/PTORequests";
global["API_PTO_BANKS"] = "TA.Clock/api/v1/Employee/PTORequests/PTOBanks";

/*------------ API Field name --------------*/
global["AF_TOKEN"] = "token";
global["AF_LOGIN_NAME"] = "loginname";
global["AF_PASSWORD"] = "password";
global["AF_COMPANY_CODE"] = "companycode";
global["AF_CARD_ID"] = "cardID";
global["AF_PIN"] = "PIN";
global["PTO_REQUEST_ID"] = "ptoRequestId";

global['AF_PTO_REQUEST_ID'] = "ptoRequestId";
global['AF_PTO_PAYTYPE_ID'] = "payTypeId";
global['AF_PTO_REQUESTED_DATE'] = "requestedDate";
global['AF_PTO_HOURS'] = "hours";
global['AF_PTO_START_TIME'] = "startTime";
global['AF_PTO_NOTES'] = "notes";
global['AF_PTO_IS_ALL_DAY'] = "isAllDay";

/*------------ Punch Type ------------------*/
global["IN"] = "I";
global["OUT"] = "O";
global["LUNCH_START"] = "LO";
global["LUNCH_END"] = "LI";
global["BREAK_START"] = "BO";
global["BREAK_END"] = "BI";
global["SWITCH"] = "S";

/*------------- CLOCK Event key name -------*/
global["KEY_SYNC_CLOCK_SETUP"] = "SYNC_CLOCK_SETUP";
global["KEY_SYNC_LEVELCODES"] = "SYNC_LEVELCODES";

/*------------- Crypto Setting name --------*/
global["CRYPTO_ALGORITHM"] = 'aes-256-ctr';
global["CRYPTO_PASSWORD"] = 'treering_time_bot';

/*------------- Error Type ------------------*/
global["ERROR_WORKSPACE"] = 'Your workspace is not registered to Treering Time. Please contact TreeRing Time Serivce.';
global["ERROR_CONFIG"] = 'We can\'t get your workspace configuration data.';
global["ERROR_TOKEN"] = 'We cant\' connect to your treering time server. Please check your network connection or server status.';
global["ERROR_USER"] = 'error_user';