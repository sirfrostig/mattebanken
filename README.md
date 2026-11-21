# Min frågebank

En enkel, statisk frågebank för Math test builder. Här finns bara filer, inget gränssnitt.
Programmet läser filerna direkt från webbadressen.

## Så här är mapparna tänkta

```
index.json                 listan över filer (skapas av tools/make-index.mjs)
questions/                 frågor (.mtbq), lägg dem i valfria undermappar
  algebra/linear-equations.mtbq
  geometry/area.mtbq
tests/                     prov (.mtbt)
  warm-up.mtbt
tools/make-index.mjs       skriptet som skapar index.json
.github/workflows/pages.yml   publicerar sajten på GitHub Pages
```

Mapparna är bara till för att du ska hålla ordning. Du kan lägga filerna var du vill och
döpa mapparna som du vill, bara filerna slutar på `.mtbq`, `.mtbt` eller `.json`.
Alla filer under mapparna tas med automatiskt.

## Publicera på GitHub Pages

1. Skapa ett nytt **publikt** repo på GitHub och ladda upp innehållet i den här mappen
   (inklusive den dolda mappen `.github`).
2. Gå till **Settings → Pages** och välj **Source: GitHub Actions**.
3. Efter någon minut finns sajten på `https://DITT-ANVÄNDARNAMN.github.io/REPONAMN/`.
   Adressen du ger programmet är: `https://DITT-ANVÄNDARNAMN.github.io/REPONAMN/index.json`
4. I programmet: fliken **Questions → External question banks**, klistra in adressen och tryck
   **Add bank**.

## Lägga till frågor och prov

1. I programmet: markera frågor och tryck **Export selected questions** (blir en `.mtbq`-fil),
   eller tryck **Export** vid ett prov (blir en `.mtbt`-fil).
2. Lägg filen i en lämplig mapp här (till exempel `questions/algebra/`).
3. Spara ändringen i repot (commit och push till `main`). Sajten uppdateras av sig själv.

I programmet kan du sedan trycka **Fetch again** vid banken för att se de nya filerna.

Ändra namnet och beskrivningen av banken i `index.json` (fälten `name` och `description`).
De följer med när indexet byggs om.

## Utan GitHub Actions

Du kan också köra `node tools/make-index.mjs` på din dator (Node.js 18 eller nyare), spara den
nya `index.json` i repot och välja **Settings → Pages → Deploy from a branch** i stället.

## Bra att veta

- Ett publikt repo betyder att alla kan läsa frågorna, även om de inte har adressen.
- Skriptet hoppar över filer som inte går att läsa och säger vilka.
- Samma fråga (samma id) i två filer räknas bara en gång.
- Lösenordsskydd: krypterade filer (mtb-encrypt-bank.mjs) kan inte ligga inuti ett index.
  Använd i så fall en enda krypterad fil som bank i stället för den här mappstrukturen.
