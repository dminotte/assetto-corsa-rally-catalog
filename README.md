# Assetto Corsa Rally – Catalog

Community data about **Assetto Corsa Rally**: cars, stages (specials), regions, weather and race modes,
with English and French labels and the **names the game uses internally** in its save files.

It is used by the Assetto Rally Times leaderboard and its Companion app to recognise and name what they read from a save file.

> Unofficial and non-commercial. Not affiliated with, endorsed or sponsored by Kunos Simulazioni, Steam or Valve.
> Assetto Corsa Rally and all related names, trademarks and logos belong to their respective owners and are used only to refer to the game.

## The file

Everything lives in one file: [`donnees.json`](donnees.json).

| Section | Content |
|---|---|
| `regions` | Region ids and labels (FR/EN) |
| `cars` | Each car: `id`, `name`, `labels` (FR/EN), `class`, `drivetrain`, `group`, `category`, and `sav_aliases` |
| `stages` | Each course: `id`, `region`, `name`, `labels`, and its `specials` |
| `stages[].specials` | Each special: `id`, `name`, `labels`, and `sav_aliases` |
| `modes` / `weather` | Game value → label (e.g. `WT_CLEAR` → `Soleil`) |

`sav_aliases` is the list of **internal names the game writes in its save file** for that car or special
(for example `GreeceS4LoutrakiCut1Forward` for the special "New Loutraki").
Writing them on the item they identify keeps names and labels in sync.

```json
{
  "id": "new-loutraki",
  "name": "New Loutraki",
  "labels": { "fr": "New Loutraki", "en": "New Loutraki" },
  "sav_aliases": ["GreeceS4LoutrakiCut1Forward"]
}
```

## Contributing

You found a car or a special that is missing, or a name that is wrong? Open a pull request.

1. Add or fix the entry in `donnees.json`.
2. For a new car or special, include its in-game name in `sav_aliases`. It is visible in the save file
   `PlayerDataSaveSlot.sav` and shown as-is by the Companion when a name is unknown.
3. Fill the French and English labels.
4. Open a pull request describing what you changed and how you checked it (a screenshot of the game is welcome).

The maintainer reviews and merges by hand. Nothing reaches the website until the maintainer merges and publishes.

### Rules checked automatically

- ids are unique (cars, courses, specials)
- every item has a `name` and `labels.fr` / `labels.en`
- each in-game name (`sav_aliases`) is used by one item only, and contains only letters, digits and `_` (80 characters at most)
- every course has a known `region` and at least one special
- `modes` and `weather` map text to text

## How it is used

The Assetto Rally Times website serves this file and the Companion downloads it when it has changed,
so a new stage or car can be added without releasing a new version of either.

## License

To be defined by the maintainer.

---

## Français

Catalogue communautaire d'**Assetto Corsa Rally** : voitures, spéciales, régions, météo et modes de course, avec libellés FR/EN et
**noms internes du jeu** (`sav_aliases`). Données non officielles, sans affiliation avec Kunos Simulazioni, Steam ni Valve.

Pour contribuer : modifie `donnees.json` (id unique, nom du jeu dans `sav_aliases`, libellés FR et EN) et ouvre une pull request.
Le mainteneur relit et fusionne à la main.
