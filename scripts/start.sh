BASE_URL=https://raw.githubusercontent.com/xorgram/xor/$(deno eval "await Deno.stdout.write(new TextEncoder().encode((await (await fetch(\"https://api.github.com/repos/xorgram/xor/tags\")).json())[0].name))")
deno run --allow-env --allow-net --allow-read --allow-run --allow-write --allow-import --import-map=$BASE_URL/import_map.json -r $BASE_URL/main.ts
