export function encodeAsQueryString(json) 
{
    var result = ''
    for (var key in json) {
        let val = json[key]
        val = encodeURIComponent(val)
        result += result?'&':''
        result += `${key}=${val}`
    }
    return result
}

export function loadFromFile(fileManager, path) {
    let contents = fileManager.readString(path)
    return JSON.parse(contents)
}

export function writeToFile(fileManager, path, json) {
    fileManager.writeString(path, JSON.stringify(json))
}
