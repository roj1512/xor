$BaseUrl = "https://raw.githubusercontent.com/xorgram/xor/$((Invoke-RestMethod -Uri "https://api.github.com/repos/xorgram/xor/tags")[0].name)"
deno run --allow-env --allow-net --allow-read --allow-run --allow-write --allow-import --import-map=$BaseUrl/import_map.json -r $BaseUrl/main.ts
