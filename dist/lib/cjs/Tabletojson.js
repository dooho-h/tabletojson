"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tabletojson = exports.Tabletojson = void 0;
const cheerio = __importStar(require("cheerio"));
class Tabletojson {
    static convert(html, options = {
        useFirstRowForHeadings: false,
        stripHtmlFromHeadings: true,
        stripHtmlFromCells: true,
        stripHtml: null,
        forceIndexAsNumber: false,
        countDuplicateHeadings: true,
        ignoreColumns: null,
        onlyColumns: null,
        ignoreHiddenRows: true,
        headings: null,
        containsClasses: null,
        id: null,
        limitrows: null,
    }) {
        options = Object.assign({
            useFirstRowForHeadings: false,
            stripHtmlFromHeadings: true,
            stripHtmlFromCells: true,
            stripHtml: null,
            forceIndexAsNumber: false,
            countDuplicateHeadings: true,
            ignoreColumns: null,
            onlyColumns: null,
            ignoreHiddenRows: true,
            headings: null,
            containsClasses: null,
            id: null,
            limitrows: null,
        }, options);
        if (options.stripHtml === true) {
            options.stripHtmlFromHeadings = true;
            options.stripHtmlFromCells = true;
        }
        else if (options.stripHtml === false) {
            options.stripHtmlFromHeadings = false;
            options.stripHtmlFromCells = false;
        }
        const jsonResponse = [];
        let suffix;
        const $ = cheerio.load(html);
        let additionalSelectors = options.containsClasses ? `.${options.containsClasses.join('.')}` : '';
        additionalSelectors = options.id ? `${additionalSelectors}#${options.id}` : '';
        $(`table${additionalSelectors}`).each((_i, table) => {
            const tableAsJson = [];
            const alreadySeen = {};
            const columnHeadings = [];
            let trs = $(table).find('tr');
            if (options.useFirstRowForHeadings) {
                trs = $(trs[0]);
            }
            let headingsCounter = 0;
            trs.each((_index, row) => {
                const cells = options.useFirstRowForHeadings
                    ? $(row).find('td, th')
                    : $(row).find('th');
                cells.each((j, cell) => {
                    if (options.onlyColumns && !options.onlyColumns.includes(j))
                        return;
                    if (options.ignoreColumns && !options.onlyColumns && options.ignoreColumns.includes(j))
                        return;
                    let value = '';
                    if (options.headings) {
                        value = options.headings[headingsCounter++];
                    }
                    else {
                        const cheerioCell = $(cell);
                        const cheerioCellText = cheerioCell.text();
                        const cheerioCellHtml = cheerioCell.html();
                        value = options.stripHtmlFromHeadings
                            ? cheerioCellText.trim()
                            : cheerioCellHtml
                                ? cheerioCellHtml.trim()
                                : '';
                    }
                    const seen = alreadySeen[value];
                    if (seen && options.countDuplicateHeadings) {
                        suffix = ++alreadySeen[value];
                        columnHeadings[j] = value !== '' ? `${value}_${suffix}` : `${j}`;
                    }
                    else {
                        alreadySeen[value] = 1;
                        columnHeadings[j] = value;
                    }
                });
            });
            let rowspans = [];
            $(table)
                .find('tr')
                .each(function (i, row) {
                const rowAsJson = {};
                function setColumn(j, content) {
                    if (columnHeadings[j] && !options.forceIndexAsNumber) {
                        rowAsJson[columnHeadings[j]] = content;
                    }
                    else {
                        rowAsJson[j] = content;
                    }
                }
                rowspans.forEach((rowspan, index) => {
                    if (!rowspan)
                        return;
                    setColumn(index, rowspan.content);
                    rowspan.value--;
                });
                const nextrowspans = [...rowspans];
                const cells = options.useFirstRowForHeadings
                    ? $(row).find('td, th')
                    : $(row).find('td');
                cells.each((j, cell) => {
                    if (options.ignoreHiddenRows) {
                        const style = $(row).attr('style');
                        if (style) {
                            const m = style.match(/.*display.*:.*none.*/g);
                            if (m && m.length > 0)
                                return;
                        }
                    }
                    let aux = j;
                    j = 0;
                    do {
                        while (rowspans[j])
                            j++;
                        while (aux && !rowspans[j]) {
                            j++;
                            aux--;
                        }
                    } while (aux);
                    if (options.onlyColumns && !options.onlyColumns.includes(j))
                        return;
                    if (options.ignoreColumns && !options.onlyColumns && options.ignoreColumns.includes(j))
                        return;
                    const cheerioCell = $(cell);
                    const cheerioCellText = cheerioCell.text();
                    const cheerioCellHtml = cheerioCell.html();
                    const cheerioCellRowspan = cheerioCell.attr('rowspan');
                    const content = options.stripHtmlFromCells
                        ? cheerioCellText.trim()
                        : cheerioCellHtml
                            ? cheerioCellHtml.trim()
                            : '';
                    setColumn(j, content);
                    const value = cheerioCellRowspan ? parseInt(cheerioCellRowspan, 10) - 1 : 0;
                    if (value > 0)
                        nextrowspans[j] = { content, value };
                });
                rowspans = nextrowspans;
                rowspans.forEach((rowspan, index) => {
                    if (rowspan && rowspan.value === 0)
                        rowspans[index] = null;
                });
                if (JSON.stringify(rowAsJson) !== '{}')
                    tableAsJson.push(rowAsJson);
                if (options.limitrows && i === options.limitrows) {
                    return false;
                }
            });
            const dataContained = tableAsJson.length > 0;
            const pushToJsonResult = Array.isArray(tableAsJson) && dataContained;
            if (!pushToJsonResult) {
                return true;
            }
            jsonResponse.push(tableAsJson);
        });
        return jsonResponse;
    }
    static convertUrl(url, callbackFunctionOrOptions, callbackFunction) {
        return __awaiter(this, void 0, void 0, function* () {
            let options;
            let fetchOptions;
            if (callbackFunction &&
                typeof callbackFunction === 'function' &&
                typeof callbackFunctionOrOptions === 'object') {
                options = callbackFunctionOrOptions;
                fetchOptions = options.fetchOptions || {};
                const result = yield fetch(url, fetchOptions);
                const resultMimetype = result.headers.get('content-type');
                if (resultMimetype && !resultMimetype.includes('text/')) {
                    throw new Error('Tabletojson can just handle text/** mimetypes');
                }
                return callbackFunction.call(this, Tabletojson.convert(yield result.text(), options));
            }
            else if (typeof callbackFunctionOrOptions === 'function') {
                const result = yield fetch(url);
                const resultMimetype = result.headers.get('content-type');
                if (resultMimetype && !resultMimetype.includes('text/')) {
                    throw new Error('Tabletojson can just handle text/** mimetypes');
                }
                return callbackFunctionOrOptions.call(this, Tabletojson.convert(yield result.text()));
            }
            else {
                options = callbackFunctionOrOptions || {};
                fetchOptions = options.fetchOptions || {};
                const result = yield fetch(url);
                const resultMimetype = result.headers.get('content-type');
                if (resultMimetype && !resultMimetype.includes('text/')) {
                    throw new Error('Tabletojson can just handle text/** mimetypes');
                }
                return Tabletojson.convert(yield result.text(), options);
            }
        });
    }
}
exports.Tabletojson = Tabletojson;
exports.tabletojson = Tabletojson;
//# sourceMappingURL=Tabletojson.js.map