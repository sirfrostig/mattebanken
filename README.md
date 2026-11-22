# Min frågebank

Statiska filer för Math test builder, ingen sida och inget gränssnitt. Programmet läser
GitHub-repot direkt, så **det finns inget att bygga eller publicera**: ladda upp en fil eller
en mapp, så syns den i programmet efter några minuter.

## Så här fungerar mapparna

```
bank.json                    (valfri) namn och beskrivning av huvudbanken
questions/ och tests/        hör till huvudbanken (frågor .mtbq, prov .mtbt)
algebra/                     en mapp på översta nivån är en egen bank
  bank.json                  (valfri) {"name": "Algebra", "description": "Ekvationer och funktioner"}
  linear-equations.mtbq
  tests/warm-up.mtbt         undermappar inom en bank spelar ingen roll, de är bara till för ordning
geometri/                    en annan bank
  area.mtbq
```

- **Varje mapp på översta nivån är en egen bank.** Filerna i roten och i mapparna `questions`
  och `tests` hör till huvudbanken. Mappar som börjar med punkt hoppas över.
- Alla filer som slutar på `.mtbq`, `.mtbt` eller `.json` tas med automatiskt, var de än ligger i mappen.
- `bank.json` i en mapp ger banken ett namn och en beskrivning. Utan den används mappens namn.
  Ändrar du namnet i `bank.json` ändras det i programmet nästa gång banken hämtas.
- Nya mappar dyker upp som nya banker i programmet av sig själva. Du kan kryssa ur de du inte vill ha.

## Komma igång

1. Skapa ett **publikt** repo på GitHub och ladda upp innehållet i den här mappen.
2. Lägg in adressen i programmet (**+ Add question bank**): `https://DITT-ANVÄNDARNAMN.github.io/REPONAMN/`
   eller `https://github.com/DITT-ANVÄNDARNAMN/REPONAMN`. GitHub Pages behöver inte vara påslaget.

## Lägga till frågor och prov

1. I programmet: **Export selected questions** (blir en `.mtbq`-fil) eller **Export** vid ett prov (blir en `.mtbt`-fil).
2. På GitHub: öppna mappen där filen ska ligga, **Add file → Upload files**, dra in filen och **Commit changes**.
3. I programmet: öppna banken i övre fältet och tryck **Fetch again**, eller ladda om sidan.
   GitHub sparar filerna en kort stund, så det kan ta några minuter innan en ny fil syns.

## Bra att veta

- Ett publikt repo betyder att alla kan läsa frågorna, även utan adressen.
- Programmet läser filförteckningen via GitHubs API. Webbläsaren frågar bara om ändringar, vilket inte
  räknas mot GitHubs gräns, men om många öppnar programmet från samma nät samtidigt kan gränsen nås.
  Då visas ett meddelande, och det går över efter en stund.
- Privata repon och andra webbplatser än GitHub: kör `node tools/make-index.mjs` (Node.js 18 eller nyare)
  och lägg den nya `index.json` bredvid filerna. Samma mappregler gäller. Då behövs en adress som slutar
  på `index.json`.
- Samma fråga (samma id) i två filer räknas bara en gång.
- Krypterade filer (mtb-encrypt-bank.mjs) kan inte ligga inuti ett index eller i ett GitHub-repo som bank.
  Använd i så fall en enda krypterad fil.
