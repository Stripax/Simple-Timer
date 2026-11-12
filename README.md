# Hetki — yksinkertainen ajastin

Suomenkielinen ajastin ilman asennettavia riippuvuuksia. Avaa `dist/index.html` selaimessa tai suorita `npm start` ja avaa http://127.0.0.1:4173.

- Valitse äänimerkin väli pudotusvalikosta. 10 sekunnin valinnalla voit kokeilla toiminnan nopeasti.
- Anna halutessasi **kokonaisaika minuutteina** (1–1440). Esimerkiksi 100 minuutin kokonaisaika ja 1 minuutin väli antavat merkin joka minuutti. Näyttö laskee yhtäjaksoisesti 00:00 → 100:00 ja pysähtyy vasta kokonaisajan lopussa. Tyhjä kenttä säilyttää yhden jakson toiminnan.
- **Aloita / Tauko / Jatka:** aloita tai jatka juoksevaa aikaa ja pidä tauko.
- **Pysäytä:** lopeta ajo ja säilytä lukema. Seuraava ajo alkaa nollasta.
- **Nollaa:** pysäytä ajo ja palauta lukema nollaan.
- Lyhyet äänimerkit kuuluvat 3, 2 ja 1 sekuntia ennen jokaista jakson rajaa. Rajalla kuuluu 1,15 sekunnin ääni ja ajanotto jatkuu. Kokonaisajan lopussa kuuluu sama merkkisarja ja ajanotto pysähtyy. Myös viimeinen vajaa jakso saa loppumerkin, eikä täsmälleen jakson rajalle osuva kokonaisaika tuota kahta merkkiä.
- **Kokeile ääntä:** toistaa saman äänimerkkisarjan. Ääni tulee selaimen käyttämään äänilaitteeseen; valitse kaiuttimet käyttöjärjestelmän ääniasetuksista.
- Välilyönti aloittaa tai tauottaa ajanoton, kun kohdistus ei ole painikkeessa tai valikossa.

Ääni käynnistetään käyttäjän painalluksesta selaimen automaattisen toiston sääntöjen mukaisesti. Äänimerkit ajoitetaan Web Audio -kellolla, joten taustavälilehden harvempi ruudunpäivitys ei normaalisti viivästytä niitä. Pidä sivu auki, laite hereillä ja selaimen äänet päällä: nukkuva laite tai selaimen jäädyttämä sivu ei voi taata ääniä. Sovellus käyttää järjestelmän fonttia, jos Google Fonts ei ole saatavilla.

Testit: `npm test`. Testit kattavat ajan täyttymisen, tauon ja jatkamisen, stopin, nollauksen, rajatilanteet sekä äänien ajoituksen ja perumisen.
