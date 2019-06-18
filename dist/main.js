/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/app.ts":
/*!********************!*\
  !*** ./src/app.ts ***!
  \********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar console = __webpack_require__(/*! console */ \"console\");\n\nvar cookieParser = __webpack_require__(/*! cookie-parser */ \"cookie-parser\");\n\nvar express = __webpack_require__(/*! express */ \"express\");\n\nvar createError = __webpack_require__(/*! http-errors */ \"http-errors\");\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar logger = __webpack_require__(/*! morgan */ \"morgan\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar ddragon_data_1 = __webpack_require__(/*! ./crontab/ddragon-data */ \"./src/crontab/ddragon-data.ts\");\n\nvar season_1 = __webpack_require__(/*! ./crontab/season */ \"./src/crontab/season.ts\");\n\nvar redis_1 = __webpack_require__(/*! ./db/redis */ \"./src/db/redis.ts\");\n\nvar router = __webpack_require__(/*! ./routes */ \"./src/routes/index.ts\");\n\nvar app = express();\napp.use(logger('dev'));\napp.use(express.json());\napp.use(express.urlencoded({\n  extended: false\n}));\napp.use(cookieParser());\napp.use(express[\"static\"](path.join(__dirname, 'public')));\napp.use('/summoner', router.summonerRouter);\napp.use('/static', router.staticRouter);\napp.use(function (req, res, next) {\n  next(createError(404));\n});\napp.use(function (err, req, res, next) {\n  res.status(err.status || 500);\n  res.json({\n    message: err.message,\n    data: err.data\n  });\n});\nvar db = mongoose_1.connection;\ndb.on('error', console.error);\ndb.once('open', function () {\n  console.log('Connected to mongod server');\n});\nvar USER = 'ysm1180';\nvar PASSWORD = 'jesntaids0811';\nvar HOST = 'localhost';\nvar PORT = 27017;\nvar DATABASE = 'lol-explorer';\nmongoose_1.connect(\"mongodb://\".concat(USER, \":\").concat(PASSWORD, \"@\").concat(HOST, \":\").concat(PORT, \"/\").concat(DATABASE, \"?retryWrites=true\"), {\n  useNewUrlParser: true\n}); // Redis\n\nredis_1.redisClient.auth('XwUNb6ViW7knzlL2rEIZCOGybdJzEliQ', function (err) {\n  if (err) {\n    console.log(err);\n  }\n}); // Init\n\nif (true) {\n  season_1.loadPatchFile();\n  ddragon_data_1.updateAllStaticData();\n} // Run Server\n\n\nvar port = normalizePort(process.env.PORT || '3000');\napp.listen(port);\n\nfunction normalizePort(val) {\n  var port = parseInt(val, 10);\n\n  if (isNaN(port)) {\n    return val;\n  }\n\n  if (port >= 0) {\n    return port;\n  }\n\n  return false;\n}\n\n//# sourceURL=webpack:///./src/app.ts?");

/***/ }),

/***/ "./src/constants.ts":
/*!**************************!*\
  !*** ./src/constants.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nvar BASE_API_URL = 'https://kr.api.riotgames.com';\nexports.LOL_API_KEY = 'RGAPI-f2417de0-bbc0-4e70-88d9-5c13547b0781';\nexports.LOL_URL = {\n  VERSION: 'https://ddragon.leagueoflegends.com/api/versions.json',\n  PROFILE_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/profileicon/%s.png',\n  STATIC_CHAMPION_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/champion.json',\n  STATIC_CHAMPION_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/champion/%s.json',\n  CHAMPION_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/champion/%s',\n  CHAMPION_PASSIVE_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/passive/%s',\n  CHAMPION_SPELL_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/spell/%s',\n  STATIC_SPELL_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/summoner.json',\n  SPELL_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/spell/%s',\n  STATIC_ITEM_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/item.json',\n  ITEM_ICON: 'http://ddragon.leagueoflegends.com/cdn/%s/img/item/%s',\n  PATCH: 'https://raw.githubusercontent.com/CommunityDragon/Data/master/patches.json',\n  STATIC_PERK_ALL_DATA: 'http://ddragon.leagueoflegends.com/cdn/%s/data/ko_KR/runesReforged.json',\n  BASE_PERK_ICON_URL: 'https://ddragon.leagueoflegends.com/cdn/img/'\n};\nexports.LOL_API = {\n  GET_SUMMONER_BY_ACCOUNT_ID: BASE_API_URL + '/lol/summoner/v4/summoners/by-account/%s',\n  GET_SUMMONER_BY_ID: BASE_API_URL + '/lol/summoner/v4/summoners/%s',\n  GET_SUMMONER_BY_NAME: BASE_API_URL + '/lol/summoner/v4/summoners/by-name/%s',\n  GET_CHAMPION_MASTERIES: BASE_API_URL + '/lol/champion-mastery/v4/champion-masteries/by-summoner/%s',\n  GET_MATCH_LIST_BY_ACCOUNT_ID: BASE_API_URL + '/lol/match/v4/matchlists/by-account/%s',\n  GET_MATCH_INFO_BY_GAME_ID: BASE_API_URL + '/lol/match/v4/matches/%d',\n  GET_SUMMONER_LEAGUE_BY_ID: BASE_API_URL + '/lol/league/v4/entries/by-summoner/%s'\n};\n\n//# sourceURL=webpack:///./src/constants.ts?");

/***/ }),

/***/ "./src/crontab/ddragon-data.ts":
/*!*************************************!*\
  !*** ./src/crontab/ddragon-data.ts ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar axios_1 = __webpack_require__(/*! axios */ \"axios\");\n\nvar console = __webpack_require__(/*! console */ \"console\");\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar util = __webpack_require__(/*! util */ \"util\");\n\nvar constants_1 = __webpack_require__(/*! ../constants */ \"./src/constants.ts\");\n\nvar lol_1 = __webpack_require__(/*! ../lib/lol */ \"./src/lib/lol.ts\");\n\nvar champion_1 = __webpack_require__(/*! ../models/static/champion */ \"./src/models/static/champion.ts\");\n\nvar spell_1 = __webpack_require__(/*! ../models/static/spell */ \"./src/models/static/spell.ts\");\n\nvar item_1 = __webpack_require__(/*! ../models/static/item */ \"./src/models/static/item.ts\");\n\nfunction updateChampionData() {\n  return _updateChampionData.apply(this, arguments);\n}\n\nfunction _updateChampionData() {\n  _updateChampionData = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee() {\n    var version, championDataFolderPath, versionDataPath, allChampionData, url, response, jsonData, key, value, champion, championDataPath, _url, _response;\n\n    return regeneratorRuntime.wrap(function _callee$(_context) {\n      while (1) {\n        switch (_context.prev = _context.next) {\n          case 0:\n            _context.next = 2;\n            return lol_1.getLastVersion();\n\n          case 2:\n            version = _context.sent;\n            championDataFolderPath = path.resolve(__dirname, 'data', 'champion');\n            versionDataPath = path.resolve(championDataFolderPath, version);\n            allChampionData = path.resolve(versionDataPath, 'champion_all.json');\n            console.log('[Champion] Check static champion data file...');\n\n            if (!fs.existsSync(versionDataPath)) {\n              if (!fs.existsSync(championDataFolderPath)) {\n                fs.mkdirSync(championDataFolderPath);\n              }\n\n              console.log(\"[Champion] Making version \".concat(version, \" folder...\"));\n              fs.mkdirSync(versionDataPath);\n            }\n\n            if (fs.existsSync(allChampionData)) {\n              _context.next = 22;\n              break;\n            }\n\n            url = util.format(constants_1.LOL_URL.STATIC_CHAMPION_ALL_DATA, version);\n            _context.prev = 10;\n            console.log(\"[Champion] Getting \".concat(url, \" data...\"));\n            _context.next = 14;\n            return axios_1[\"default\"].get(url);\n\n          case 14:\n            response = _context.sent;\n            fs.writeFileSync(allChampionData, JSON.stringify(response.data));\n            console.log('[Champion] Written all champion json data.');\n            _context.next = 22;\n            break;\n\n          case 19:\n            _context.prev = 19;\n            _context.t0 = _context[\"catch\"](10);\n            console.log(_context.t0);\n\n          case 22:\n            jsonData = JSON.parse(fs.readFileSync(allChampionData, {\n              encoding: 'utf8'\n            }));\n            _context.t1 = regeneratorRuntime.keys(jsonData.data);\n\n          case 24:\n            if ((_context.t2 = _context.t1()).done) {\n              _context.next = 48;\n              break;\n            }\n\n            key = _context.t2.value;\n            value = jsonData.data[key];\n            _context.next = 29;\n            return champion_1[\"default\"].findOne({\n              key: Number(value.key)\n            }).exec();\n\n          case 29:\n            champion = _context.sent;\n\n            if (!champion) {\n              new champion_1[\"default\"]({\n                key: Number(value.key),\n                id: key\n              }).save();\n              console.log(\"[Champion] Saved champion data \".concat(value.key, \" : \").concat(key, \" to db.\"));\n            }\n\n            championDataPath = path.resolve(versionDataPath, String(value.key) + '.json');\n\n            if (fs.existsSync(championDataPath)) {\n              _context.next = 46;\n              break;\n            }\n\n            _url = util.format(constants_1.LOL_URL.STATIC_CHAMPION_DATA, version, key);\n            _context.prev = 34;\n            console.log(\"[Champion] Getting \".concat(key, \" champion data \").concat(_url));\n            _context.next = 38;\n            return axios_1[\"default\"].get(_url);\n\n          case 38:\n            _response = _context.sent;\n            fs.writeFileSync(championDataPath, JSON.stringify(_response.data));\n            _context.next = 45;\n            break;\n\n          case 42:\n            _context.prev = 42;\n            _context.t3 = _context[\"catch\"](34);\n            console.log(_context.t3);\n\n          case 45:\n            console.log(\"[Champion] Written \".concat(key, \" champion data.\"));\n\n          case 46:\n            _context.next = 24;\n            break;\n\n          case 48:\n            console.log('[Champion] Fine.');\n\n          case 49:\n          case \"end\":\n            return _context.stop();\n        }\n      }\n    }, _callee, null, [[10, 19], [34, 42]]);\n  }));\n  return _updateChampionData.apply(this, arguments);\n}\n\nexports.updateChampionData = updateChampionData;\n\nfunction updateSpellData() {\n  return _updateSpellData.apply(this, arguments);\n}\n\nfunction _updateSpellData() {\n  _updateSpellData = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee2() {\n    var version, spellDataFolderPath, versionDataPath, allSpellData, url, response, jsonData, key, value, spell;\n    return regeneratorRuntime.wrap(function _callee2$(_context2) {\n      while (1) {\n        switch (_context2.prev = _context2.next) {\n          case 0:\n            _context2.next = 2;\n            return lol_1.getLastVersion();\n\n          case 2:\n            version = _context2.sent;\n            spellDataFolderPath = path.resolve(__dirname, 'data', 'spell');\n            versionDataPath = path.resolve(spellDataFolderPath, version);\n            allSpellData = path.resolve(versionDataPath, 'spell_all.json');\n            console.log('[Spell] Check static spell data file...');\n\n            if (!fs.existsSync(versionDataPath)) {\n              if (!fs.existsSync(spellDataFolderPath)) {\n                fs.mkdirSync(spellDataFolderPath);\n              }\n\n              console.log(\"[Spell] Making version \".concat(version, \" folder...\"));\n              fs.mkdirSync(versionDataPath);\n            }\n\n            if (fs.existsSync(allSpellData)) {\n              _context2.next = 22;\n              break;\n            }\n\n            url = util.format(constants_1.LOL_URL.STATIC_SPELL_ALL_DATA, version);\n            _context2.prev = 10;\n            console.log(\"[Spell] Getting \".concat(url, \" data...\"));\n            _context2.next = 14;\n            return axios_1[\"default\"].get(url);\n\n          case 14:\n            response = _context2.sent;\n            fs.writeFileSync(allSpellData, JSON.stringify(response.data));\n            _context2.next = 21;\n            break;\n\n          case 18:\n            _context2.prev = 18;\n            _context2.t0 = _context2[\"catch\"](10);\n            console.log(_context2.t0);\n\n          case 21:\n            console.log('[Spell] Written all spell json data.');\n\n          case 22:\n            jsonData = JSON.parse(fs.readFileSync(allSpellData, {\n              encoding: 'utf8'\n            }));\n            _context2.t1 = regeneratorRuntime.keys(jsonData.data);\n\n          case 24:\n            if ((_context2.t2 = _context2.t1()).done) {\n              _context2.next = 33;\n              break;\n            }\n\n            key = _context2.t2.value;\n            value = jsonData.data[key];\n            _context2.next = 29;\n            return spell_1[\"default\"].findOne({\n              key: Number(value.key)\n            }).exec();\n\n          case 29:\n            spell = _context2.sent;\n\n            if (!spell) {\n              new spell_1[\"default\"]({\n                key: Number(value.key),\n                id: key\n              }).save();\n              console.log(\"[Spell] Saved spell data \".concat(value.key, \" : \").concat(key, \" to db.\"));\n            }\n\n            _context2.next = 24;\n            break;\n\n          case 33:\n            console.log('[Spell] Fine.');\n\n          case 34:\n          case \"end\":\n            return _context2.stop();\n        }\n      }\n    }, _callee2, null, [[10, 18]]);\n  }));\n  return _updateSpellData.apply(this, arguments);\n}\n\nexports.updateSpellData = updateSpellData;\n\nfunction updateItemData() {\n  return _updateItemData.apply(this, arguments);\n}\n\nfunction _updateItemData() {\n  _updateItemData = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee3() {\n    var version, itemDataFolderPath, versionDataPath, allItemData, url, response, jsonData, key, value, item;\n    return regeneratorRuntime.wrap(function _callee3$(_context3) {\n      while (1) {\n        switch (_context3.prev = _context3.next) {\n          case 0:\n            _context3.next = 2;\n            return lol_1.getLastVersion();\n\n          case 2:\n            version = _context3.sent;\n            itemDataFolderPath = path.resolve(__dirname, 'data', 'item');\n            versionDataPath = path.resolve(itemDataFolderPath, version);\n            allItemData = path.resolve(versionDataPath, 'item_all.json');\n            console.log('[Item] Check static item data file...');\n\n            if (!fs.existsSync(versionDataPath)) {\n              if (!fs.existsSync(itemDataFolderPath)) {\n                fs.mkdirSync(itemDataFolderPath);\n              }\n\n              console.log(\"[Item] Making version \".concat(version, \" folder...\"));\n              fs.mkdirSync(versionDataPath);\n            }\n\n            if (fs.existsSync(allItemData)) {\n              _context3.next = 22;\n              break;\n            }\n\n            url = util.format(constants_1.LOL_URL.STATIC_ITEM_ALL_DATA, version);\n            _context3.prev = 10;\n            console.log(\"[Item] Getting \".concat(url, \" data...\"));\n            _context3.next = 14;\n            return axios_1[\"default\"].get(url);\n\n          case 14:\n            response = _context3.sent;\n            fs.writeFileSync(allItemData, JSON.stringify(response.data));\n            _context3.next = 21;\n            break;\n\n          case 18:\n            _context3.prev = 18;\n            _context3.t0 = _context3[\"catch\"](10);\n            console.log(_context3.t0);\n\n          case 21:\n            console.log('[Item] Written all item json data.');\n\n          case 22:\n            jsonData = JSON.parse(fs.readFileSync(allItemData, {\n              encoding: 'utf8'\n            }));\n            _context3.t1 = regeneratorRuntime.keys(jsonData.data);\n\n          case 24:\n            if ((_context3.t2 = _context3.t1()).done) {\n              _context3.next = 33;\n              break;\n            }\n\n            key = _context3.t2.value;\n            value = jsonData.data[key];\n            _context3.next = 29;\n            return item_1[\"default\"].findOne({\n              key: Number(key)\n            }).exec();\n\n          case 29:\n            item = _context3.sent;\n\n            if (!item) {\n              new item_1[\"default\"]({\n                key: Number(key)\n              }).save();\n              console.log(\"[Item] Saved item data \".concat(value.key, \" : \").concat(key, \" to db.\"));\n            }\n\n            _context3.next = 24;\n            break;\n\n          case 33:\n            console.log('[Item] Fine.');\n\n          case 34:\n          case \"end\":\n            return _context3.stop();\n        }\n      }\n    }, _callee3, null, [[10, 18]]);\n  }));\n  return _updateItemData.apply(this, arguments);\n}\n\nexports.updateItemData = updateItemData;\n\nfunction updatePerkData() {\n  return _updatePerkData.apply(this, arguments);\n}\n\nfunction _updatePerkData() {\n  _updatePerkData = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee4() {\n    var version, perkDataFolderPath, versionDataPath, allPerkData, url, response;\n    return regeneratorRuntime.wrap(function _callee4$(_context4) {\n      while (1) {\n        switch (_context4.prev = _context4.next) {\n          case 0:\n            _context4.next = 2;\n            return lol_1.getLastVersion();\n\n          case 2:\n            version = _context4.sent;\n            perkDataFolderPath = path.resolve(__dirname, 'data', 'perk');\n            versionDataPath = path.resolve(perkDataFolderPath, version);\n            allPerkData = path.resolve(versionDataPath, 'perk_all.json');\n            console.log('[Perk] Check static perk data file...');\n\n            if (!fs.existsSync(versionDataPath)) {\n              if (!fs.existsSync(perkDataFolderPath)) {\n                fs.mkdirSync(perkDataFolderPath);\n              }\n\n              console.log(\"[Perk] Making version \".concat(version, \" folder...\"));\n              fs.mkdirSync(versionDataPath);\n            }\n\n            if (fs.existsSync(allPerkData)) {\n              _context4.next = 22;\n              break;\n            }\n\n            url = util.format(constants_1.LOL_URL.STATIC_PERK_ALL_DATA, version);\n            _context4.prev = 10;\n            console.log(\"[Perk] Getting \".concat(url, \" data...\"));\n            _context4.next = 14;\n            return axios_1[\"default\"].get(url);\n\n          case 14:\n            response = _context4.sent;\n            fs.writeFileSync(allPerkData, JSON.stringify(response.data));\n            _context4.next = 21;\n            break;\n\n          case 18:\n            _context4.prev = 18;\n            _context4.t0 = _context4[\"catch\"](10);\n            console.log(_context4.t0);\n\n          case 21:\n            console.log('[Perk] Written all perk json data.');\n\n          case 22:\n            console.log('[Perk] Fine.');\n\n          case 23:\n          case \"end\":\n            return _context4.stop();\n        }\n      }\n    }, _callee4, null, [[10, 18]]);\n  }));\n  return _updatePerkData.apply(this, arguments);\n}\n\nexports.updatePerkData = updatePerkData;\n\nfunction updateAllStaticData() {\n  updateChampionData();\n  updateSpellData();\n  updateItemData();\n  updatePerkData();\n}\n\nexports.updateAllStaticData = updateAllStaticData;\n\n//# sourceURL=webpack:///./src/crontab/ddragon-data.ts?");

/***/ }),

/***/ "./src/crontab/season.ts":
/*!*******************************!*\
  !*** ./src/crontab/season.ts ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar axios_1 = __webpack_require__(/*! axios */ \"axios\");\n\nvar console = __webpack_require__(/*! console */ \"console\");\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar constants_1 = __webpack_require__(/*! ../constants */ \"./src/constants.ts\");\n\nfunction loadPatchFile() {\n  return _loadPatchFile.apply(this, arguments);\n}\n\nfunction _loadPatchFile() {\n  _loadPatchFile = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee() {\n    var dataFolderPath, patchDataPath, response;\n    return regeneratorRuntime.wrap(function _callee$(_context) {\n      while (1) {\n        switch (_context.prev = _context.next) {\n          case 0:\n            dataFolderPath = path.resolve(__dirname, 'data');\n            patchDataPath = path.resolve(dataFolderPath, 'patch.json');\n            console.log('[Patch] Check patch data file...');\n\n            if (!fs.existsSync(dataFolderPath)) {\n              fs.mkdirSync(dataFolderPath);\n            }\n\n            console.log('[Patch] Downloading patch file...');\n            _context.prev = 5;\n            _context.next = 8;\n            return axios_1[\"default\"].get(constants_1.LOL_URL.PATCH);\n\n          case 8:\n            response = _context.sent;\n            fs.writeFileSync(patchDataPath, JSON.stringify(response.data));\n            console.log('[Patch] Fine.');\n            _context.next = 17;\n            break;\n\n          case 13:\n            _context.prev = 13;\n            _context.t0 = _context[\"catch\"](5);\n            console.log('[Patch] ERROR!!!');\n            console.log(_context.t0.response);\n\n          case 17:\n          case \"end\":\n            return _context.stop();\n        }\n      }\n    }, _callee, null, [[5, 13]]);\n  }));\n  return _loadPatchFile.apply(this, arguments);\n}\n\nexports.loadPatchFile = loadPatchFile;\n\n//# sourceURL=webpack:///./src/crontab/season.ts?");

/***/ }),

/***/ "./src/db/redis.ts":
/*!*************************!*\
  !*** ./src/db/redis.ts ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar console = __webpack_require__(/*! console */ \"console\");\n\nvar redis = __webpack_require__(/*! redis */ \"redis\");\n\nvar util_1 = __webpack_require__(/*! util */ \"util\"); // redis\n\n\nexports.redisClient = redis.createClient({\n  host: 'redis-17995.c1.ap-southeast-1-1.ec2.cloud.redislabs.com',\n  port: 17995\n});\nexports.redisClient.on('connect', function () {\n  console.log('Connected to redis server');\n});\nexports.redisGetAsync = util_1.promisify(exports.redisClient.get).bind(exports.redisClient);\n\n//# sourceURL=webpack:///./src/db/redis.ts?");

/***/ }),

/***/ "./src/lib/demacia/data-dragon/storage/champion-storage.ts":
/*!*****************************************************************!*\
  !*** ./src/lib/demacia/data-dragon/storage/champion-storage.ts ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar storage_1 = __webpack_require__(/*! ./storage */ \"./src/lib/demacia/data-dragon/storage/storage.ts\");\n\nvar ChampionReadStrorage =\n/*#__PURE__*/\nfunction (_storage_1$ReadStrora) {\n  _inherits(ChampionReadStrorage, _storage_1$ReadStrora);\n\n  function ChampionReadStrorage() {\n    _classCallCheck(this, ChampionReadStrorage);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(ChampionReadStrorage).apply(this, arguments));\n  }\n\n  _createClass(ChampionReadStrorage, [{\n    key: \"get\",\n    value: function get(version, championKey) {\n      var value = this.getCache(version, championKey.toString());\n\n      if (value !== null) {\n        return value;\n      }\n\n      var championDataFile = path.join(__dirname, 'data', 'champion', version, \"\".concat(championKey, \".json\"));\n      var data = JSON.parse(fs.readFileSync(championDataFile, {\n        encoding: 'utf8'\n      }));\n      this.setCache(version, data, championKey.toString());\n      return data;\n    }\n  }]);\n\n  return ChampionReadStrorage;\n}(storage_1.ReadStrorage);\n\nexports[\"default\"] = new ChampionReadStrorage();\n\n//# sourceURL=webpack:///./src/lib/demacia/data-dragon/storage/champion-storage.ts?");

/***/ }),

/***/ "./src/lib/demacia/data-dragon/storage/item-storage.ts":
/*!*************************************************************!*\
  !*** ./src/lib/demacia/data-dragon/storage/item-storage.ts ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar storage_1 = __webpack_require__(/*! ./storage */ \"./src/lib/demacia/data-dragon/storage/storage.ts\");\n\nvar ItemReadStrorage =\n/*#__PURE__*/\nfunction (_storage_1$ReadStrora) {\n  _inherits(ItemReadStrorage, _storage_1$ReadStrora);\n\n  function ItemReadStrorage() {\n    _classCallCheck(this, ItemReadStrorage);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(ItemReadStrorage).apply(this, arguments));\n  }\n\n  _createClass(ItemReadStrorage, [{\n    key: \"get\",\n    value: function get(version, itemKey) {\n      var value = this.getCache(version, itemKey.toString());\n\n      if (value !== null) {\n        return value;\n      }\n\n      var allItemDataFile = path.join(__dirname, 'data', 'item', version, 'item_all.json');\n      var allData = JSON.parse(fs.readFileSync(allItemDataFile, {\n        encoding: 'utf8'\n      }));\n      var data = allData.data[itemKey.toString()];\n      this.setCache(version, data, itemKey.toString());\n      return data;\n    }\n  }]);\n\n  return ItemReadStrorage;\n}(storage_1.ReadStrorage);\n\nexports[\"default\"] = new ItemReadStrorage();\n\n//# sourceURL=webpack:///./src/lib/demacia/data-dragon/storage/item-storage.ts?");

/***/ }),

/***/ "./src/lib/demacia/data-dragon/storage/perk-storage.ts":
/*!*************************************************************!*\
  !*** ./src/lib/demacia/data-dragon/storage/perk-storage.ts ***!
  \*************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar storage_1 = __webpack_require__(/*! ./storage */ \"./src/lib/demacia/data-dragon/storage/storage.ts\");\n\nvar PerkReadStrorage =\n/*#__PURE__*/\nfunction (_storage_1$ReadStrora) {\n  _inherits(PerkReadStrorage, _storage_1$ReadStrora);\n\n  function PerkReadStrorage() {\n    _classCallCheck(this, PerkReadStrorage);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(PerkReadStrorage).apply(this, arguments));\n  }\n\n  _createClass(PerkReadStrorage, [{\n    key: \"get\",\n    value: function get(version) {\n      var value = this.getCache(version);\n\n      if (value !== null) {\n        return value;\n      }\n\n      var allPerkDataFile = path.join(__dirname, 'data', 'perk', version, 'perk_all.json');\n      var allData = JSON.parse(fs.readFileSync(allPerkDataFile, {\n        encoding: 'utf8'\n      }));\n      this.setCache(version, allData);\n      return allData;\n    }\n  }]);\n\n  return PerkReadStrorage;\n}(storage_1.ReadStrorage);\n\nexports[\"default\"] = new PerkReadStrorage();\n\n//# sourceURL=webpack:///./src/lib/demacia/data-dragon/storage/perk-storage.ts?");

/***/ }),

/***/ "./src/lib/demacia/data-dragon/storage/spell-storage.ts":
/*!**************************************************************!*\
  !*** ./src/lib/demacia/data-dragon/storage/spell-storage.ts ***!
  \**************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction _typeof(obj) { if (typeof Symbol === \"function\" && typeof Symbol.iterator === \"symbol\") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === \"function\" && obj.constructor === Symbol && obj !== Symbol.prototype ? \"symbol\" : typeof obj; }; } return _typeof(obj); }\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nfunction _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === \"object\" || typeof call === \"function\")) { return call; } return _assertThisInitialized(self); }\n\nfunction _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError(\"this hasn't been initialised - super() hasn't been called\"); } return self; }\n\nfunction _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }\n\nfunction _inherits(subClass, superClass) { if (typeof superClass !== \"function\" && superClass !== null) { throw new TypeError(\"Super expression must either be null or a function\"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }\n\nfunction _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar storage_1 = __webpack_require__(/*! ./storage */ \"./src/lib/demacia/data-dragon/storage/storage.ts\");\n\nvar SpellReadStrorage =\n/*#__PURE__*/\nfunction (_storage_1$ReadStrora) {\n  _inherits(SpellReadStrorage, _storage_1$ReadStrora);\n\n  function SpellReadStrorage() {\n    _classCallCheck(this, SpellReadStrorage);\n\n    return _possibleConstructorReturn(this, _getPrototypeOf(SpellReadStrorage).apply(this, arguments));\n  }\n\n  _createClass(SpellReadStrorage, [{\n    key: \"get\",\n    value: function get(version, spellId) {\n      var value = this.getCache(version, spellId);\n\n      if (value !== null) {\n        return value;\n      }\n\n      var allSpellDataFile = path.join(__dirname, 'data', 'spell', version, 'spell_all.json');\n      var allData = JSON.parse(fs.readFileSync(allSpellDataFile, {\n        encoding: 'utf8'\n      }));\n      var data = allData.data[spellId];\n      this.setCache(version, data, spellId);\n      return data;\n    }\n  }]);\n\n  return SpellReadStrorage;\n}(storage_1.ReadStrorage);\n\nexports[\"default\"] = new SpellReadStrorage();\n\n//# sourceURL=webpack:///./src/lib/demacia/data-dragon/storage/spell-storage.ts?");

/***/ }),

/***/ "./src/lib/demacia/data-dragon/storage/storage.ts":
/*!********************************************************!*\
  !*** ./src/lib/demacia/data-dragon/storage/storage.ts ***!
  \********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError(\"Cannot call a class as a function\"); } }\n\nfunction _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if (\"value\" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }\n\nfunction _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar ReadStrorage =\n/*#__PURE__*/\nfunction () {\n  function ReadStrorage() {\n    _classCallCheck(this, ReadStrorage);\n\n    this.cacheData = {};\n  }\n\n  _createClass(ReadStrorage, [{\n    key: \"getCache\",\n    value: function getCache(key, subKey) {\n      if (this.cacheData[key] !== undefined) {\n        if (subKey) {\n          if (this.cacheData[key][subKey] !== undefined) {\n            return this.cacheData[key][subKey];\n          }\n        } else {\n          return this.cacheData[key];\n        }\n      }\n\n      return null;\n    }\n  }, {\n    key: \"setCache\",\n    value: function setCache(key, value, subKey) {\n      if (subKey) {\n        if (this.cacheData[key] !== undefined) {\n          this.cacheData[key][subKey] = value;\n        } else {\n          this.cacheData[key] = {};\n          this.cacheData[key][subKey] = value;\n        }\n      } else {\n        this.cacheData[key] = value;\n      }\n    }\n  }]);\n\n  return ReadStrorage;\n}();\n\nexports.ReadStrorage = ReadStrorage;\n\n//# sourceURL=webpack:///./src/lib/demacia/data-dragon/storage/storage.ts?");

/***/ }),

/***/ "./src/lib/lol.ts":
/*!************************!*\
  !*** ./src/lib/lol.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\n\nfunction _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }\n\nfunction _nonIterableSpread() { throw new TypeError(\"Invalid attempt to spread non-iterable instance\"); }\n\nfunction _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === \"[object Arguments]\") return Array.from(iter); }\n\nfunction _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar axios_1 = __webpack_require__(/*! axios */ \"axios\");\n\nvar console = __webpack_require__(/*! console */ \"console\");\n\nvar fs = __webpack_require__(/*! fs */ \"fs\");\n\nvar path = __webpack_require__(/*! path */ \"path\");\n\nvar constants_1 = __webpack_require__(/*! ../constants */ \"./src/constants.ts\");\n\nvar redis_1 = __webpack_require__(/*! ../db/redis */ \"./src/db/redis.ts\");\n\nfunction parseToRateLimit(str) {\n  var result = {};\n  var limits = str.split(',');\n  limits.forEach(function (limitStr) {\n    var splitedStr = limitStr.split(':');\n    var callCount = Number(splitedStr[0]);\n    var seconds = splitedStr[1];\n    result[seconds] = callCount;\n  });\n  return result;\n}\n\nfunction convertToRateLimitDisplay(rateLimits) {\n  var strs = [];\n\n  for (var second in rateLimits) {\n    strs.push(\"\".concat(rateLimits[second], \" calls per \").concat(second, \" seconds\"));\n  }\n\n  return strs.join(', ');\n}\n\nfunction sequentialCallLolApis(itemsOfArray) {\n  return itemsOfArray.reduce(function (prevPromise, items) {\n    return prevPromise.then(function (chainResults) {\n      var promises = [];\n      items.forEach(function (item) {\n        var promise;\n\n        if (item.url !== '') {\n          promise = callLolApi(item.url, item.params).then(function (game) {\n            return {\n              save: true,\n              data: game\n            };\n          });\n        } else {\n          promise = Promise.resolve(item.data).then(function (game) {\n            return {\n              save: false,\n              data: game\n            };\n          });\n        }\n\n        promises.push(promise);\n      });\n      return Promise.all(promises).then(function (currentResults) {\n        return [].concat(_toConsumableArray(chainResults), _toConsumableArray(currentResults));\n      });\n    })[\"catch\"](function (err) {\n      return Promise.reject(err);\n    });\n  }, Promise.resolve([]));\n}\n\nexports.sequentialCallLolApis = sequentialCallLolApis;\n\nfunction callLolApi(url) {\n  var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};\n  return new Promise(function (resolve, reject) {\n    axios_1[\"default\"]({\n      url: url,\n      method: 'get',\n      params: params,\n      headers: {\n        'X-Riot-Token': constants_1.LOL_API_KEY\n      }\n    }).then(function (response) {\n      var headers = response.headers;\n      var appRateLimit = parseToRateLimit(headers['x-app-rate-limit']);\n      var appRateLimitCount = parseToRateLimit(headers['x-app-rate-limit-count']);\n      var methodRateLimit = parseToRateLimit(headers['x-method-rate-limit']);\n      var methodRateLimitCount = parseToRateLimit(headers['x-method-rate-limit-count']);\n      var warning = false;\n\n      for (var second in appRateLimit) {\n        if (appRateLimit[second] <= appRateLimitCount[second]) {\n          console.warn('*************** Closed to application rate limit ***************');\n          console.warn(\"     Limit : \".concat(convertToRateLimitDisplay(appRateLimit)));\n          console.warn(\"     Current : \".concat(convertToRateLimitDisplay(appRateLimitCount)));\n          warning = true;\n        }\n      }\n\n      for (var second in methodRateLimit) {\n        if (methodRateLimit[second] <= methodRateLimitCount[second]) {\n          console.warn('*************** Closed to method rate limit ***************');\n          console.warn(\"     Limit : \".concat(convertToRateLimitDisplay(methodRateLimit)));\n          console.warn(\"     Current : \".concat(convertToRateLimitDisplay(methodRateLimitCount)));\n          warning = true;\n        }\n      }\n\n      if (warning) {\n        setTimeout(function () {\n          resolve(response.data);\n        }, 1000);\n      } else {\n        resolve(response.data);\n      }\n    })[\"catch\"](function (err) {\n      if (err.response.status === 429) {\n        var headers = err.response.headers;\n        var rateLimitType = headers['x-rate-limit-type'];\n        var rateLimit = '';\n        var rateLimitCount = '';\n        var retryAfterSecond = 1;\n\n        if (rateLimitType === 'application') {\n          rateLimit = headers['x-app-rate-limit'];\n          rateLimitCount = headers['x-app-rate-limit-count'];\n          retryAfterSecond = Number(headers['retry-after']);\n        } else if (rateLimitType === 'method') {\n          rateLimit = headers['x-method-rate-limit'];\n          rateLimitCount = headers['x-method-rate-limit-count'];\n          retryAfterSecond = Number(headers['retry-after']);\n        } else if (rateLimitType === 'service') {\n          // inspect app rate\n          rateLimit = headers['x-app-rate-limit'];\n          rateLimitCount = headers['x-app-rate-limit-count'];\n          retryAfterSecond = Number(headers['retry-after']);\n        } else {\n          rateLimitType = 'underlying-service'; // inspect app rate\n\n          rateLimit = headers['x-app-rate-limit'];\n          rateLimitCount = headers['x-app-rate-limit-count'];\n        }\n\n        console.warn(\"********************** Exceed \".concat(rateLimitType.toUpperCase(), \" Rate Limit **********************\"));\n\n        if (rateLimit) {\n          console.warn(\"     Limit : \".concat(convertToRateLimitDisplay(parseToRateLimit(rateLimit))));\n        }\n\n        if (rateLimitCount) {\n          console.warn(\"     Current : \".concat(convertToRateLimitDisplay(parseToRateLimit(rateLimitCount))));\n        }\n\n        console.warn(\"     Retry to call after \".concat(retryAfterSecond, \" seconds\"));\n        setTimeout(function () {\n          callLolApi(url, params).then(function (data) {\n            console.log('     Success to recall by 429 Error');\n            resolve(data);\n          })[\"catch\"](function (err) {\n            reject(err);\n          });\n        }, retryAfterSecond * 1000);\n      } else {\n        reject(err);\n      }\n    });\n  });\n}\n\nexports.callLolApi = callLolApi;\n\nfunction getLastVersion() {\n  return _getLastVersion.apply(this, arguments);\n}\n\nfunction _getLastVersion() {\n  _getLastVersion = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee() {\n    var version, res;\n    return regeneratorRuntime.wrap(function _callee$(_context) {\n      while (1) {\n        switch (_context.prev = _context.next) {\n          case 0:\n            _context.next = 2;\n            return redis_1.redisGetAsync('LOL_LAST_VERSION');\n\n          case 2:\n            version = _context.sent;\n\n            if (version) {\n              _context.next = 9;\n              break;\n            }\n\n            _context.next = 6;\n            return axios_1[\"default\"].get(constants_1.LOL_URL.VERSION);\n\n          case 6:\n            res = _context.sent;\n            version = res.data[0];\n            redis_1.redisClient.set('LOL_LAST_VERSION', version, 'EX', 43200);\n\n          case 9:\n            return _context.abrupt(\"return\", version);\n\n          case 10:\n          case \"end\":\n            return _context.stop();\n        }\n      }\n    }, _callee);\n  }));\n  return _getLastVersion.apply(this, arguments);\n}\n\nexports.getLastVersion = getLastVersion;\n\nfunction getLastSeason() {\n  return _getLastSeason.apply(this, arguments);\n}\n\nfunction _getLastSeason() {\n  _getLastSeason = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee2() {\n    var season, dataFolderPath, patchDataPath, jsonData, patchData, utcNow, last;\n    return regeneratorRuntime.wrap(function _callee2$(_context2) {\n      while (1) {\n        switch (_context2.prev = _context2.next) {\n          case 0:\n            _context2.next = 2;\n            return redis_1.redisGetAsync('LOL_LAST_SEASON_ID');\n\n          case 2:\n            season = _context2.sent;\n\n            if (season) {\n              _context2.next = 23;\n              break;\n            }\n\n            _context2.prev = 4;\n            dataFolderPath = path.resolve(__dirname, 'data');\n            patchDataPath = path.resolve(dataFolderPath, 'patch.json');\n            jsonData = JSON.parse(fs.readFileSync(patchDataPath, {\n              encoding: 'utf8'\n            }));\n            patchData = jsonData.patches;\n            utcNow = new Date(new Date().toUTCString()).getTime();\n\n          case 10:\n            if (!patchData.length) {\n              _context2.next = 17;\n              break;\n            }\n\n            last = patchData.pop();\n\n            if (!(last.start < utcNow)) {\n              _context2.next = 15;\n              break;\n            }\n\n            season = last.season;\n            return _context2.abrupt(\"break\", 17);\n\n          case 15:\n            _context2.next = 10;\n            break;\n\n          case 17:\n            redis_1.redisClient.set('LOL_LAST_SEASON_ID', season, 'EX', 43200);\n            _context2.next = 23;\n            break;\n\n          case 20:\n            _context2.prev = 20;\n            _context2.t0 = _context2[\"catch\"](4);\n            console.error(_context2.t0);\n\n          case 23:\n            return _context2.abrupt(\"return\", Number(season));\n\n          case 24:\n          case \"end\":\n            return _context2.stop();\n        }\n      }\n    }, _callee2, null, [[4, 20]]);\n  }));\n  return _getLastSeason.apply(this, arguments);\n}\n\nexports.getLastSeason = getLastSeason;\n\n//# sourceURL=webpack:///./src/lib/lol.ts?");

/***/ }),

/***/ "./src/models/game.ts":
/*!****************************!*\
  !*** ./src/models/game.ts ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar gameSchema = new mongoose_1.Schema({\n  gameId: Number,\n  platformId: String,\n  gameCreation: Number,\n  gameDuration: Number,\n  queueId: Number,\n  mapId: Number,\n  seasonId: Number,\n  gameVersion: String,\n  gameMode: String,\n  gameType: String,\n  teams: {\n    type: ['Mixed']\n  },\n  participants: {\n    type: ['Mixed']\n  },\n  participantIdentities: {\n    type: ['Mixed']\n  }\n});\nexports[\"default\"] = mongoose_1.model('game', gameSchema);\n\n//# sourceURL=webpack:///./src/models/game.ts?");

/***/ }),

/***/ "./src/models/league.ts":
/*!******************************!*\
  !*** ./src/models/league.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar leagueSchema = new mongoose_1.Schema({\n  leagueId: String,\n  queueType: String,\n  tier: String,\n  rank: String,\n  summonerId: String,\n  summonerName: String,\n  leaguePoints: Number,\n  wins: Number,\n  losses: Number,\n  veteran: Boolean,\n  inactive: Boolean,\n  freshBlood: Boolean,\n  hotStreak: Boolean,\n  season: Number,\n  miniSeries: {\n    type: ['Mixed'],\n    required: false\n  }\n});\nexports[\"default\"] = mongoose_1.model('league', leagueSchema);\n\n//# sourceURL=webpack:///./src/models/league.ts?");

/***/ }),

/***/ "./src/models/match.ts":
/*!*****************************!*\
  !*** ./src/models/match.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar matchSchema = new mongoose_1.Schema({\n  summonerAccountId: String,\n  platformId: String,\n  gameId: Number,\n  champion: Number,\n  queue: Number,\n  season: Number,\n  timestamp: Number,\n  role: String,\n  lane: String\n});\nexports[\"default\"] = mongoose_1.model('match', matchSchema);\n\n//# sourceURL=webpack:///./src/models/match.ts?");

/***/ }),

/***/ "./src/models/static/champion.ts":
/*!***************************************!*\
  !*** ./src/models/static/champion.ts ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar staticChampionSchema = new mongoose_1.Schema({\n  id: String,\n  key: Number\n});\nexports[\"default\"] = mongoose_1.model('static_champion', staticChampionSchema);\n\n//# sourceURL=webpack:///./src/models/static/champion.ts?");

/***/ }),

/***/ "./src/models/static/item.ts":
/*!***********************************!*\
  !*** ./src/models/static/item.ts ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar staticItemSchema = new mongoose_1.Schema({\n  key: Number\n});\nexports[\"default\"] = mongoose_1.model('static_item', staticItemSchema);\n\n//# sourceURL=webpack:///./src/models/static/item.ts?");

/***/ }),

/***/ "./src/models/static/spell.ts":
/*!************************************!*\
  !*** ./src/models/static/spell.ts ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar staticSpellSchema = new mongoose_1.Schema({\n  id: String,\n  key: Number\n});\nexports[\"default\"] = mongoose_1.model('static_spell', staticSpellSchema);\n\n//# sourceURL=webpack:///./src/models/static/spell.ts?");

/***/ }),

/***/ "./src/models/summoner.ts":
/*!********************************!*\
  !*** ./src/models/summoner.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar mongoose_1 = __webpack_require__(/*! mongoose */ \"mongoose\");\n\nvar summonerSchema = new mongoose_1.Schema({\n  name: String,\n  profileIconId: Number,\n  puuid: String,\n  summonerLevel: Number,\n  accountId: String,\n  id: String,\n  revisionDate: Number,\n  updatedTs: {\n    type: Date,\n    \"default\": Date.now\n  }\n});\nexports[\"default\"] = mongoose_1.model('summoner', summonerSchema);\n\n//# sourceURL=webpack:///./src/models/summoner.ts?");

/***/ }),

/***/ "./src/routes/index.ts":
/*!*****************************!*\
  !*** ./src/routes/index.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar summoner_1 = __webpack_require__(/*! ./summoner */ \"./src/routes/summoner.ts\");\n\nexports.summonerRouter = summoner_1[\"default\"];\n\nvar static_1 = __webpack_require__(/*! ./static */ \"./src/routes/static.ts\");\n\nexports.staticRouter = static_1[\"default\"];\n\n//# sourceURL=webpack:///./src/routes/index.ts?");

/***/ }),

/***/ "./src/routes/static.ts":
/*!******************************!*\
  !*** ./src/routes/static.ts ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar express_1 = __webpack_require__(/*! express */ \"express\");\n\nvar lodash = __webpack_require__(/*! lodash */ \"lodash\");\n\nvar util_1 = __webpack_require__(/*! util */ \"util\");\n\nvar constants_1 = __webpack_require__(/*! ../constants */ \"./src/constants.ts\");\n\nvar champion_storage_1 = __webpack_require__(/*! ../lib/demacia/data-dragon/storage/champion-storage */ \"./src/lib/demacia/data-dragon/storage/champion-storage.ts\");\n\nvar spell_storage_1 = __webpack_require__(/*! ../lib/demacia/data-dragon/storage/spell-storage */ \"./src/lib/demacia/data-dragon/storage/spell-storage.ts\");\n\nvar lol_1 = __webpack_require__(/*! ../lib/lol */ \"./src/lib/lol.ts\");\n\nvar champion_1 = __webpack_require__(/*! ../models/static/champion */ \"./src/models/static/champion.ts\");\n\nvar spell_1 = __webpack_require__(/*! ../models/static/spell */ \"./src/models/static/spell.ts\");\n\nvar item_1 = __webpack_require__(/*! ../models/static/item */ \"./src/models/static/item.ts\");\n\nvar item_storage_1 = __webpack_require__(/*! ../lib/demacia/data-dragon/storage/item-storage */ \"./src/lib/demacia/data-dragon/storage/item-storage.ts\");\n\nvar perk_storage_1 = __webpack_require__(/*! ../lib/demacia/data-dragon/storage/perk-storage */ \"./src/lib/demacia/data-dragon/storage/perk-storage.ts\");\n\nvar router = express_1.Router();\nrouter.get('/champion/all', function (req, res, next) {\n  champion_1[\"default\"].find().then(\n  /*#__PURE__*/\n  function () {\n    var _ref = _asyncToGenerator(\n    /*#__PURE__*/\n    regeneratorRuntime.mark(function _callee(champions) {\n      var version, result;\n      return regeneratorRuntime.wrap(function _callee$(_context) {\n        while (1) {\n          switch (_context.prev = _context.next) {\n            case 0:\n              _context.next = 2;\n              return lol_1.getLastVersion();\n\n            case 2:\n              version = _context.sent;\n              result = champions.map(function (champion) {\n                var fileData = champion_storage_1[\"default\"].get(version, champion.key);\n                var rawData = fileData.data[champion.id];\n                var clientData = lodash.cloneDeep(rawData);\n                clientData.key = Number(clientData.key);\n                clientData.iconUrl = util_1.format(constants_1.LOL_URL.CHAMPION_ICON, version, rawData.image.full);\n                clientData.passive.iconUrl = util_1.format(constants_1.LOL_URL.CHAMPION_PASSIVE_ICON, version, rawData.passive.image.full);\n                clientData.spells = clientData.spells.map(function (spell) {\n                  spell.iconUrl = util_1.format(constants_1.LOL_URL.CHAMPION_SPELL_ICON, version, spell.image.full);\n                  delete spell.image;\n                  delete spell.effect;\n                  delete spell.effectBurn;\n                  return spell;\n                });\n                delete clientData.passive.image;\n                delete clientData.image;\n                delete clientData.recommended;\n                return clientData;\n              });\n              res.json(result);\n\n            case 5:\n            case \"end\":\n              return _context.stop();\n          }\n        }\n      }, _callee);\n    }));\n\n    return function (_x) {\n      return _ref.apply(this, arguments);\n    };\n  }());\n});\nrouter.get('/spell/all', function (req, res, next) {\n  spell_1[\"default\"].find().then(\n  /*#__PURE__*/\n  function () {\n    var _ref2 = _asyncToGenerator(\n    /*#__PURE__*/\n    regeneratorRuntime.mark(function _callee2(spells) {\n      var version, result;\n      return regeneratorRuntime.wrap(function _callee2$(_context2) {\n        while (1) {\n          switch (_context2.prev = _context2.next) {\n            case 0:\n              _context2.next = 2;\n              return lol_1.getLastVersion();\n\n            case 2:\n              version = _context2.sent;\n              result = spells.map(function (spell) {\n                var rawData = spell_storage_1[\"default\"].get(version, spell.id);\n                var clientData = lodash.cloneDeep(rawData);\n                clientData.key = Number(clientData.key);\n                clientData.iconUrl = util_1.format(constants_1.LOL_URL.SPELL_ICON, version, rawData.image.full);\n                delete clientData.image;\n                delete clientData.effect;\n                delete clientData.effectBurn;\n                delete clientData.modes;\n                return clientData;\n              });\n              res.json(result);\n\n            case 5:\n            case \"end\":\n              return _context2.stop();\n          }\n        }\n      }, _callee2);\n    }));\n\n    return function (_x2) {\n      return _ref2.apply(this, arguments);\n    };\n  }());\n});\nrouter.get('/item/all', function (req, res, next) {\n  item_1[\"default\"].find().then(\n  /*#__PURE__*/\n  function () {\n    var _ref3 = _asyncToGenerator(\n    /*#__PURE__*/\n    regeneratorRuntime.mark(function _callee3(items) {\n      var version, result;\n      return regeneratorRuntime.wrap(function _callee3$(_context3) {\n        while (1) {\n          switch (_context3.prev = _context3.next) {\n            case 0:\n              _context3.next = 2;\n              return lol_1.getLastVersion();\n\n            case 2:\n              version = _context3.sent;\n              result = items.map(function (item) {\n                var rawData = item_storage_1[\"default\"].get(version, item.key);\n                var clientData = lodash.cloneDeep(rawData);\n                clientData.key = item.key;\n                clientData.iconUrl = util_1.format(constants_1.LOL_URL.ITEM_ICON, version, rawData.image.full);\n                delete clientData.image;\n                delete clientData.effect;\n                delete clientData.maps;\n                delete clientData.stats;\n                delete clientData.tags;\n                delete clientData.depth;\n                return clientData;\n              });\n              res.json(result);\n\n            case 5:\n            case \"end\":\n              return _context3.stop();\n          }\n        }\n      }, _callee3);\n    }));\n\n    return function (_x3) {\n      return _ref3.apply(this, arguments);\n    };\n  }());\n});\nrouter.get('/item/all', function (req, res, next) {\n  item_1[\"default\"].find().then(\n  /*#__PURE__*/\n  function () {\n    var _ref4 = _asyncToGenerator(\n    /*#__PURE__*/\n    regeneratorRuntime.mark(function _callee4(items) {\n      var version, result;\n      return regeneratorRuntime.wrap(function _callee4$(_context4) {\n        while (1) {\n          switch (_context4.prev = _context4.next) {\n            case 0:\n              _context4.next = 2;\n              return lol_1.getLastVersion();\n\n            case 2:\n              version = _context4.sent;\n              result = items.map(function (item) {\n                var rawData = item_storage_1[\"default\"].get(version, item.key);\n                var clientData = lodash.cloneDeep(rawData);\n                clientData.key = item.key;\n                clientData.iconUrl = util_1.format(constants_1.LOL_URL.ITEM_ICON, version, rawData.image.full);\n                delete clientData.image;\n                delete clientData.effect;\n                delete clientData.maps;\n                delete clientData.stats;\n                delete clientData.tags;\n                delete clientData.depth;\n                return clientData;\n              });\n              res.json(result);\n\n            case 5:\n            case \"end\":\n              return _context4.stop();\n          }\n        }\n      }, _callee4);\n    }));\n\n    return function (_x4) {\n      return _ref4.apply(this, arguments);\n    };\n  }());\n});\nrouter.get('/perk/all', function (req, res, next) {\n  lol_1.getLastVersion().then(function (version) {\n    var rawData = perk_storage_1[\"default\"].get(version);\n    var clientData = lodash.cloneDeep(rawData);\n\n    for (var i = 0; i < clientData.length; i++) {\n      clientData[i].baseIconUrl = constants_1.LOL_URL.BASE_PERK_ICON_URL;\n    }\n\n    res.json(clientData);\n  });\n});\nexports[\"default\"] = router;\n\n//# sourceURL=webpack:///./src/routes/static.ts?");

/***/ }),

/***/ "./src/routes/summoner.ts":
/*!********************************!*\
  !*** ./src/routes/summoner.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nfunction asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }\n\nfunction _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"next\", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, \"throw\", err); } _next(undefined); }); }; }\n\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\n\nvar console = __webpack_require__(/*! console */ \"console\");\n\nvar express_1 = __webpack_require__(/*! express */ \"express\");\n\nvar lodash = __webpack_require__(/*! lodash */ \"lodash\");\n\nvar querystring_1 = __webpack_require__(/*! querystring */ \"querystring\");\n\nvar util_1 = __webpack_require__(/*! util */ \"util\");\n\nvar constants_1 = __webpack_require__(/*! ../constants */ \"./src/constants.ts\");\n\nvar lol_1 = __webpack_require__(/*! ../lib/lol */ \"./src/lib/lol.ts\");\n\nvar game_1 = __webpack_require__(/*! ../models/game */ \"./src/models/game.ts\");\n\nvar league_1 = __webpack_require__(/*! ../models/league */ \"./src/models/league.ts\");\n\nvar match_1 = __webpack_require__(/*! ../models/match */ \"./src/models/match.ts\");\n\nvar summoner_1 = __webpack_require__(/*! ../models/summoner */ \"./src/models/summoner.ts\");\n\nvar router = express_1.Router();\n\nfunction getOrCreateLeagueData(_x, _x2) {\n  return _getOrCreateLeagueData.apply(this, arguments);\n}\n\nfunction _getOrCreateLeagueData() {\n  _getOrCreateLeagueData = _asyncToGenerator(\n  /*#__PURE__*/\n  regeneratorRuntime.mark(function _callee7(id, lastSeason) {\n    return regeneratorRuntime.wrap(function _callee7$(_context7) {\n      while (1) {\n        switch (_context7.prev = _context7.next) {\n          case 0:\n            return _context7.abrupt(\"return\", league_1[\"default\"].find({\n              summonerId: id,\n              season: lastSeason\n            }).then(\n            /*#__PURE__*/\n            function () {\n              var _ref6 = _asyncToGenerator(\n              /*#__PURE__*/\n              regeneratorRuntime.mark(function _callee6(items) {\n                var leagueList, leagueUrl, leagueDataList, i, docs;\n                return regeneratorRuntime.wrap(function _callee6$(_context6) {\n                  while (1) {\n                    switch (_context6.prev = _context6.next) {\n                      case 0:\n                        leagueList = items;\n\n                        if (!(items.length == 0)) {\n                          _context6.next = 18;\n                          break;\n                        }\n\n                        leagueUrl = util_1.format(constants_1.LOL_API.GET_SUMMONER_LEAGUE_BY_ID, querystring_1.escape(id));\n                        _context6.prev = 3;\n                        _context6.next = 6;\n                        return lol_1.callLolApi(leagueUrl);\n\n                      case 6:\n                        leagueDataList = _context6.sent;\n\n                        for (i = 0; i < leagueDataList.length; i++) {\n                          leagueDataList[i].season = lastSeason;\n                        }\n\n                        _context6.next = 10;\n                        return league_1[\"default\"].collection.insertMany(leagueDataList);\n\n                      case 10:\n                        docs = _context6.sent;\n                        console.info('%d leagues were stored.', docs.insertedCount);\n                        leagueList = docs.ops;\n                        _context6.next = 18;\n                        break;\n\n                      case 15:\n                        _context6.prev = 15;\n                        _context6.t0 = _context6[\"catch\"](3);\n                        return _context6.abrupt(\"return\", Promise.reject(_context6.t0));\n\n                      case 18:\n                        return _context6.abrupt(\"return\", Promise.resolve(leagueList));\n\n                      case 19:\n                      case \"end\":\n                        return _context6.stop();\n                    }\n                  }\n                }, _callee6, null, [[3, 15]]);\n              }));\n\n              return function (_x9) {\n                return _ref6.apply(this, arguments);\n              };\n            }())[\"catch\"](function (err) {\n              return Promise.reject(err);\n            }));\n\n          case 1:\n          case \"end\":\n            return _context7.stop();\n        }\n      }\n    }, _callee7);\n  }));\n  return _getOrCreateLeagueData.apply(this, arguments);\n}\n\nrouter.get('/:name', function (req, res, next) {\n  summoner_1[\"default\"].findOne({\n    name: req.params.name\n  },\n  /*#__PURE__*/\n  function () {\n    var _ref = _asyncToGenerator(\n    /*#__PURE__*/\n    regeneratorRuntime.mark(function _callee3(err, summoner) {\n      var lastSeason, version, url;\n      return regeneratorRuntime.wrap(function _callee3$(_context3) {\n        while (1) {\n          switch (_context3.prev = _context3.next) {\n            case 0:\n              if (err) {\n                next(err);\n              }\n\n              _context3.next = 3;\n              return lol_1.getLastSeason();\n\n            case 3:\n              lastSeason = _context3.sent;\n              _context3.next = 6;\n              return lol_1.getLastVersion();\n\n            case 6:\n              version = _context3.sent;\n\n              if (!summoner) {\n                url = util_1.format(constants_1.LOL_API.GET_SUMMONER_BY_NAME, querystring_1.escape(req.params.name));\n                lol_1.callLolApi(url).then(\n                /*#__PURE__*/\n                function () {\n                  var _ref2 = _asyncToGenerator(\n                  /*#__PURE__*/\n                  regeneratorRuntime.mark(function _callee(summonerData) {\n                    var summoners;\n                    return regeneratorRuntime.wrap(function _callee$(_context) {\n                      while (1) {\n                        switch (_context.prev = _context.next) {\n                          case 0:\n                            _context.prev = 0;\n                            _context.next = 3;\n                            return summoner_1[\"default\"].find({\n                              id: summonerData.id\n                            }).limit(1);\n\n                          case 3:\n                            summoners = _context.sent;\n\n                            if (summoners.length === 0) {\n                              summoner = new summoner_1[\"default\"](summonerData);\n                            } else {\n                              summoner = summoners[0];\n\n                              if (!summoner) {\n                                summoner = new summoner_1[\"default\"](summonerData);\n                              }\n\n                              summoner.name = req.params.name;\n                            }\n\n                            summoner.save();\n                            _context.next = 11;\n                            break;\n\n                          case 8:\n                            _context.prev = 8;\n                            _context.t0 = _context[\"catch\"](0);\n                            throw new Error(_context.t0);\n\n                          case 11:\n                            return _context.abrupt(\"return\", getOrCreateLeagueData(summoner.id, lastSeason).then(function (seasons) {\n                              if (summoner) {\n                                return Object.assign({}, summoner.toObject(), {\n                                  seasons: seasons\n                                });\n                              }\n                            }));\n\n                          case 12:\n                          case \"end\":\n                            return _context.stop();\n                        }\n                      }\n                    }, _callee, null, [[0, 8]]);\n                  }));\n\n                  return function (_x5) {\n                    return _ref2.apply(this, arguments);\n                  };\n                }()).then(\n                /*#__PURE__*/\n                function () {\n                  var _ref3 = _asyncToGenerator(\n                  /*#__PURE__*/\n                  regeneratorRuntime.mark(function _callee2(summonerData) {\n                    var matchListUrl, matchData, matchList, i;\n                    return regeneratorRuntime.wrap(function _callee2$(_context2) {\n                      while (1) {\n                        switch (_context2.prev = _context2.next) {\n                          case 0:\n                            matchListUrl = util_1.format(constants_1.LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID, querystring_1.escape(summonerData.accountId));\n                            _context2.next = 3;\n                            return lol_1.callLolApi(matchListUrl);\n\n                          case 3:\n                            matchData = _context2.sent;\n                            matchList = matchData.matches;\n\n                            for (i = 0; i < matchList.length; i++) {\n                              matchList[i].summonerAccountId = summonerData.accountId;\n                            }\n\n                            _context2.next = 8;\n                            return match_1[\"default\"].collection.insertMany(matchList);\n\n                          case 8:\n                            return _context2.abrupt(\"return\", summonerData);\n\n                          case 9:\n                          case \"end\":\n                            return _context2.stop();\n                        }\n                      }\n                    }, _callee2);\n                  }));\n\n                  return function (_x6) {\n                    return _ref3.apply(this, arguments);\n                  };\n                }()).then(function (summonerData) {\n                  res.json(Object.assign({}, summonerData, {\n                    iconUrl: util_1.format(constants_1.LOL_URL.PROFILE_ICON, version, summonerData.profileIconId)\n                  }));\n                })[\"catch\"](function (err) {\n                  res.status(err.response.status).json({\n                    error: err.response.data\n                  });\n                });\n              } else {\n                getOrCreateLeagueData(summoner.id, lastSeason).then(function (seasons) {\n                  if (summoner) {\n                    res.json(Object.assign({}, summoner.toObject(), {\n                      seasons: seasons,\n                      iconUrl: util_1.format(constants_1.LOL_URL.PROFILE_ICON, version, summoner.profileIconId)\n                    }));\n                  } else {\n                    res.status(404).json({\n                      message: 'Summoner is not found.'\n                    });\n                  }\n                });\n              }\n\n            case 8:\n            case \"end\":\n              return _context3.stop();\n          }\n        }\n      }, _callee3);\n    }));\n\n    return function (_x3, _x4) {\n      return _ref.apply(this, arguments);\n    };\n  }());\n});\nrouter.get('/matches/:accountId/:start/:count', function (req, res, next) {\n  var start = Number(req.params.start);\n  var count = Number(req.params.count);\n\n  if (start + count > 100) {\n    res.status(400).json({\n      message: 'Cannot get more than 100.'\n    });\n    return;\n  }\n\n  match_1[\"default\"].find({\n    summonerAccountId: req.params.accountId\n  }).sort({\n    timestamp: -1\n  }).skip(start).limit(count).then(\n  /*#__PURE__*/\n  function () {\n    var _ref4 = _asyncToGenerator(\n    /*#__PURE__*/\n    regeneratorRuntime.mark(function _callee5(items) {\n      var matchList, url, data, matchListData, i, docs, promises, _loop, _i;\n\n      return regeneratorRuntime.wrap(function _callee5$(_context5) {\n        while (1) {\n          switch (_context5.prev = _context5.next) {\n            case 0:\n              matchList = items.map(function (item) {\n                return item.toObject();\n              });\n\n              if (!(items.length === 0)) {\n                _context5.next = 21;\n                break;\n              }\n\n              url = util_1.format(constants_1.LOL_API.GET_MATCH_LIST_BY_ACCOUNT_ID, querystring_1.escape(req.params.accountId));\n              _context5.prev = 3;\n              _context5.next = 6;\n              return lol_1.callLolApi(url);\n\n            case 6:\n              data = _context5.sent;\n              matchListData = data.matches;\n\n              for (i = 0; i < matchListData.length; i++) {\n                matchListData[i].summonerAccountId = req.params.accountId;\n              }\n\n              _context5.next = 11;\n              return match_1[\"default\"].collection.insertMany(matchListData);\n\n            case 11:\n              docs = _context5.sent;\n              matchList = docs.ops;\n              matchList = matchList.slice(start, start + count);\n              _context5.next = 21;\n              break;\n\n            case 16:\n              _context5.prev = 16;\n              _context5.t0 = _context5[\"catch\"](3);\n              console.log(\"[callLolApi] \".concat(url));\n              console.log(_context5.t0.response);\n\n              if (_context5.t0.response.status === 404) {\n                matchList = [];\n              }\n\n            case 21:\n              if (matchList.length > 0) {\n                promises = [];\n\n                _loop = function _loop(_i) {\n                  var gameId = matchList[_i].gameId;\n\n                  var getGameApiCallingInfo = function getGameApiCallingInfo() {\n                    return game_1[\"default\"].find({\n                      gameId: Number(gameId)\n                    }).limit(1).then(function (games) {\n                      if (games.length === 0) {\n                        var _url = util_1.format(constants_1.LOL_API.GET_MATCH_INFO_BY_GAME_ID, gameId);\n\n                        return {\n                          url: _url\n                        };\n                      } else {\n                        return {\n                          url: '',\n                          data: games[0]\n                        };\n                      }\n                    });\n                  }; // const getGameApiCallingInfo = () => {\n                  //   return Game.find({ gameId: Number(gameId) })\n                  //     .limit(1)\n                  //     .then(async (games) => {\n                  //       if (games.length === 0) {\n                  //         try {\n                  //           const url = format(LOL_API.GET_MATCH_INFO_BY_GAME_ID, gameId);\n                  //           const gameData = await callLolApi<IGameData>(url);\n                  //           const game = new Game(gameData);\n                  //           game.save();\n                  //           return game;\n                  //         } catch (err) {\n                  //           return Promise.reject(err);\n                  //         }\n                  //       } else {\n                  //         return games[0];\n                  //       }\n                  //     });\n                  // };\n\n\n                  promises.push(Promise.resolve(getGameApiCallingInfo()));\n                };\n\n                for (_i = 0; _i < matchList.length; _i++) {\n                  _loop(_i);\n                }\n\n                Promise.all(promises).then(function (ajaxDataList) {\n                  var itemsOfArray = [];\n                  var items = [];\n                  var count = 0;\n                  ajaxDataList.forEach(function (ajaxData) {\n                    items.push(ajaxData);\n                    count++; // TODO : 10 is random constant, but later adjust the value by app rate.\n\n                    if (count === 10) {\n                      itemsOfArray.push(items);\n                      items = [];\n                      count = 0;\n                    }\n                  });\n                  return lol_1.sequentialCallLolApis(itemsOfArray);\n                }).then(\n                /*#__PURE__*/\n                function () {\n                  var _ref5 = _asyncToGenerator(\n                  /*#__PURE__*/\n                  regeneratorRuntime.mark(function _callee4(games) {\n                    var result;\n                    return regeneratorRuntime.wrap(function _callee4$(_context4) {\n                      while (1) {\n                        switch (_context4.prev = _context4.next) {\n                          case 0:\n                            games.forEach(function (game) {\n                              if (game.save) {\n                                new game_1[\"default\"](game.data).save();\n                              }\n                            });\n                            result = [];\n                            matchList.forEach(function (match, idx) {\n                              var data = Object.assign({}, match);\n                              var gameClientData = lodash.cloneDeep(games[idx].data);\n                              gameClientData.participants.forEach(function (participant) {\n                                var _participant$stats = participant.stats,\n                                    item0 = _participant$stats.item0,\n                                    item1 = _participant$stats.item1,\n                                    item2 = _participant$stats.item2,\n                                    item3 = _participant$stats.item3,\n                                    item4 = _participant$stats.item4,\n                                    item5 = _participant$stats.item5,\n                                    item6 = _participant$stats.item6;\n                                participant.stats.items = [item0, item1, item2, item3, item4, item5, item6];\n                                delete participant.stats.item0;\n                                delete participant.stats.item1;\n                                delete participant.stats.item2;\n                                delete participant.stats.item3;\n                                delete participant.stats.item4;\n                                delete participant.stats.item5;\n                                delete participant.stats.item6;\n                              });\n                              result.push(Object.assign({}, data, {\n                                gameInfo: gameClientData\n                              }));\n                            });\n                            res.json(result);\n\n                          case 4:\n                          case \"end\":\n                            return _context4.stop();\n                        }\n                      }\n                    }, _callee4);\n                  }));\n\n                  return function (_x8) {\n                    return _ref5.apply(this, arguments);\n                  };\n                }())[\"catch\"](function (err) {\n                  next(err);\n                });\n              } else {\n                res.json([]);\n              }\n\n            case 22:\n            case \"end\":\n              return _context5.stop();\n          }\n        }\n      }, _callee5, null, [[3, 16]]);\n    }));\n\n    return function (_x7) {\n      return _ref4.apply(this, arguments);\n    };\n  }());\n});\nexports[\"default\"] = router;\n\n//# sourceURL=webpack:///./src/routes/summoner.ts?");

/***/ }),

/***/ 0:
/*!******************************************!*\
  !*** multi @babel/polyfill ./src/app.ts ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("__webpack_require__(/*! @babel/polyfill */\"@babel/polyfill\");\nmodule.exports = __webpack_require__(/*! ./src/app.ts */\"./src/app.ts\");\n\n\n//# sourceURL=webpack:///multi_@babel/polyfill_./src/app.ts?");

/***/ }),

/***/ "@babel/polyfill":
/*!**********************************!*\
  !*** external "@babel/polyfill" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"@babel/polyfill\");\n\n//# sourceURL=webpack:///external_%22@babel/polyfill%22?");

/***/ }),

/***/ "axios":
/*!************************!*\
  !*** external "axios" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"axios\");\n\n//# sourceURL=webpack:///external_%22axios%22?");

/***/ }),

/***/ "console":
/*!**************************!*\
  !*** external "console" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"console\");\n\n//# sourceURL=webpack:///external_%22console%22?");

/***/ }),

/***/ "cookie-parser":
/*!********************************!*\
  !*** external "cookie-parser" ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"cookie-parser\");\n\n//# sourceURL=webpack:///external_%22cookie-parser%22?");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express\");\n\n//# sourceURL=webpack:///external_%22express%22?");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"fs\");\n\n//# sourceURL=webpack:///external_%22fs%22?");

/***/ }),

/***/ "http-errors":
/*!******************************!*\
  !*** external "http-errors" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"http-errors\");\n\n//# sourceURL=webpack:///external_%22http-errors%22?");

/***/ }),

/***/ "lodash":
/*!*************************!*\
  !*** external "lodash" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"lodash\");\n\n//# sourceURL=webpack:///external_%22lodash%22?");

/***/ }),

/***/ "mongoose":
/*!***************************!*\
  !*** external "mongoose" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"mongoose\");\n\n//# sourceURL=webpack:///external_%22mongoose%22?");

/***/ }),

/***/ "morgan":
/*!*************************!*\
  !*** external "morgan" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"morgan\");\n\n//# sourceURL=webpack:///external_%22morgan%22?");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"path\");\n\n//# sourceURL=webpack:///external_%22path%22?");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"querystring\");\n\n//# sourceURL=webpack:///external_%22querystring%22?");

/***/ }),

/***/ "redis":
/*!************************!*\
  !*** external "redis" ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"redis\");\n\n//# sourceURL=webpack:///external_%22redis%22?");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"util\");\n\n//# sourceURL=webpack:///external_%22util%22?");

/***/ })

/******/ });