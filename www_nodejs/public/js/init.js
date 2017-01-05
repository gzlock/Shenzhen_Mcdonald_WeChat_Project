window.url = function url(url) {
    var path = window.location.pathname;
    if (url == undefined) url = '';
    url = String(url);
    if (path[path.length - 1] != '/' && url.length > 0 && url[0] != '/')
        url = '/' + url;
    return '//' + window.location.host + window.location.pathname + url;
};
window.JsonClone = function JsonClone(obj) {
    if (obj.constructor == String)
        return JSON.parse(obj);
    return JSON.parse(JSON.stringify(obj));
};
window.randomColor = function () {
    var letters = '0123456789abcdef';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * letters.length)];
    }
    return color;
};
$(function () {
    $.ajaxSetup({
        dataType: 'json',
        contentType: 'application/json',
        timeout: 10000
    });
});