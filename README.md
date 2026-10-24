# Assetto Corsa Rally – Catalog

Community data about **Assetto Corsa Rally**: locations, tracks and stages, cars with their classes and groups,
surfaces, weather, race modes and nationalities, with French and English labels.

Tools can use it to recognise and name the stages, cars and nationalities they deal with.

> Unofficial and non-commercial. Not affiliated with, endorsed or sponsored by Kunos Simulazioni, Steam or Valve.
> Assetto Corsa Rally and all related names, trademarks and logos belong to their respective owners and are used only to refer to the game.

## The file

Everything lives in one file: [`data.json`](data.json). `gameVersion` is the version of the game the data matches,
and `schemaVersion` changes when the structure of the file does.

| List | Each item |
|---|---|
| `locations` | `id`, `name`, `labels`, `country`, `surfaces` (share of each surface in whole percent) |
| `tracks` | `id`, `location`, `name`, `labels`, `aliases` |
| `stages` | `id`, `track`, `name`, `shortName`, `labels`, `lengthKm`, `aliases` |
| `surfaces` | `id`, `name`, `labels` |
| `cars` | `id`, `manufacturer`, `name`, `labels`, `class`, `group`, `drivetrain` |
| `classes` | `id`, `group`, `name`, `labels` |
| `groups` | `id`, `name`, `labels` |
| `modes` | `id`, `name`, `labels` |
| `weather` | `id`, `name`, `labels`, `aliases` |
| `countries` | `id` (ISO code, `gb-wls` for Wales, `other` for Other), `name`, `labels`, `flag`, `aliases` |

An item refers to another by its id: a stage's `track` is the id of an item of `tracks`.
`labels`, `shortName`, `flag` and `aliases` are only written when needed, and any item may have `aliases`.

### Ids and aliases

An id is the item's identifier, as written for instance in save files, **in lowercase with only its letters and digits**:
`AlsaceS2MunsterFullReverse` becomes `alsaces2munsterfullreverse`, `Group2/4` becomes `group24`.
To find an item from such an identifier, reduce it the same way (lowercase, accents removed, letters and digits kept)
and look it up among the ids and `aliases`. Casing does not matter: `HyundaiI20NRally2` and `Hyundaii20NRally2` find the same car.

`aliases` lists, in the same form, other spellings of the same item: `wtclear` for the weather `clear` (`WT_CLEAR`),
`alsaces2munster` for the track `munster`, `irleand` for Ireland.
Countries are the exception: their id is their ISO code (`gb-wls` for Wales), and all their spellings are aliases.
`other` is the nationality "Other", which has no flag: `"flag": false`, only written there.

### Names and labels

`name` is the name displayed in the game, or an English name for race modes.
`labels.fr` and `labels.en` are only there when the catalog names the item differently in that language,
and then replace `name` in it: show `labels[language]`, or `name` when there is none.
A stage's `shortName`, for narrow displays, is only there when it differs from `name`.

```json
{
  "id": "livignotesttrack01fullforward",
  "track": "livignotesttrack01",
  "name": "Main Circuit",
  "labels": { "fr": "Circuit de Livigno", "en": "Livigno Circuit" },
  "lengthKm": 0.9
}
```

## Contributing

You found a stage or a car that is missing, or a name that is wrong? Open a pull request.

1. Add or fix the entry in `data.json`. A new item's id is its identifier, reduced as above.
2. Add `labels` where the name displayed in the game is not the one to show, in French or English.
3. Open a pull request describing what you changed and how you checked it (a screenshot is welcome).

The maintainer reviews and merges by hand.

### Rules checked automatically

A GitHub check named **Validate** runs these rules on every pull request, so you see the problem before the maintainer does.
You can run it yourself: `node scripts/validate.mjs`.

- `schemaVersion` is 3 and `gameVersion` is set
- every list is present and not empty
- ids and aliases are lowercase letters and digits (countries: ISO codes, or `other`), and each one names a single item of its list
- every item has a `name`; `labels` only hold `fr` and `en`, each different from `name`
- every reference points to an item that exists: a location's `country` and `surfaces`, a track's `location`,
  a stage's `track`, a class's `group`, a car's `class` and `group` (the group of its class)
- a location's surface shares are whole percentages adding up to 100
- a country's `flag`, when written, is `false`
- every track has a stage, and every stage a positive `lengthKm`; a `shortName` differs from `name`
- every car has a `manufacturer` and a `drivetrain`

## License

[CC BY 4.0](LICENSE). Reuse is welcome with credit to this catalog.

---

## Français

Catalogue communautaire d'**Assetto Corsa Rally** : lieux, parcours et spéciales, voitures avec leurs classes et groupes,
surfaces, météo, modes de course et nationalités, avec des libellés français et anglais.
Données non officielles, sans affiliation avec Kunos Simulazioni, Steam ni Valve.

Un id est l'identifiant de l'élément (tel qu'écrit par exemple dans les sauvegardes), en minuscules, lettres et chiffres seulement
(`alsaces2munsterfullreverse`). `labels.fr` / `labels.en` n'existent que quand le nom à afficher diffère de `name` dans cette langue.

Pour contribuer : modifie `data.json` et ouvre une pull request. Un contrôle automatique (**Validate**) vérifie les règles
sur chaque pull request. Le mainteneur relit et fusionne à la main.
