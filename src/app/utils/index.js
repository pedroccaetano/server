module.exports = {
  replaceAll(str1, str2, ignore) {
    return this.replace(
      new RegExp(
        str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g, "\\$&"),
        ignore ? "gi" : "g"
      ),
      typeof str2 == "string" ? str2.replace(/\$/g, "$$$$") : str2
    );
  },

  isSafe(value, defaultValue) {
    try {
      return value();
    } catch (e) {
      return defaultValue;
    }
  },

  baseRequestOptions(url, BufferParam = false, PageNumber = 0) {
    return {
      uri: BufferParam
        ? `http://app.scrapingbee.com/api/v1/?api_key=A6X79RC90QIWRLTXAJWUB4VO8IA7IP4VTCVU7IQLOJJU05BQMB9HZ1E6MTSNXLADLJDFZ9WGP97JQ0UK&url=${url}&render_js=True&js_snippet=${Buffer.from(
            `document.querySelector('[aria-label=\"Page ${PageNumber.toString()}\"]').click()`
          ).toString("base64")}&wait=1000`
        : `http://app.scrapingbee.com/api/v1/?api_key=A6X79RC90QIWRLTXAJWUB4VO8IA7IP4VTCVU7IQLOJJU05BQMB9HZ1E6MTSNXLADLJDFZ9WGP97JQ0UK&url=${url}&render_js=True`,
      method: "GET"
    };
  }
};
