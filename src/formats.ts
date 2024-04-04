
import { z } from 'zod';

export const CCSSchema = z.object({
	CraftingStations: z.object({
		BigCraftable: z.string().optional(),
		TileData: z.string().optional(),
		ExclusiveRecipes: z.boolean().optional(),
		CraftingRecipes: z.string().array().optional(),
		CookingRecipes: z.string().array().optional()
	}).array()
});

export type CCSSchema = z.infer<typeof CCSSchema>;


export const CPSchema = z.object({
	Format: z.string(),
	Changes: z.object({
		Action: z.union([z.literal("Load"), z.literal("EditData")]),
		Target: z.string(),
		TargetField: z.string().array().optional(),
		Entries: z.unknown()
	}).array()
});

type ExtractListType<T> = T extends (infer U)[] ? U : never;

export type CPSchema = z.infer<typeof CPSchema>;
export type CPChanges = ExtractListType<CPSchema['Changes']>;


export const BCStation = z.object({
	Id: z.string(),
	//DisplayName: z.string().optional(),  // won't be used

	AreRecipesExclusive: z.boolean().optional(),
	DisplayUknownRecipes: z.boolean().optional(),
	IsCooking: z.boolean().optional(),

	Recipes: z.string().array()
});

export type BCStation = z.infer<typeof BCStation>;



export function convert(input: CCSSchema) {

	const Changes: CPChanges[] = [],
		Tiles: string[] = [],
		Stations: Record<string, BCStation> = {};

	let i = 0,
		did_generate = false;

	console.log('input', input);

	// Let's go through our stations.
	for(const station of input.CraftingStations) {
		// Do we have a name?
		let name = station.TileData;
		if ( ! name ) {
			name = `Converted_Station_${i}_CHANGEME`;
			did_generate = true;
		} else {
			if ( name.includes(' ') )
				throw new Error('Your TileData has a space in it. Spaces are not allowed.');

			Tiles.push(name);
		}

		i++;

		if ( station.CookingRecipes?.length && station.CraftingRecipes?.length )
			throw new Error('Your station has both cooking AND crafting recipes. That is not supported.');

		let recipes: string[],
			cooking = false;
		if ( station.CookingRecipes?.length ) {
			recipes = station.CookingRecipes;
			cooking = true;
		} else if ( station.CraftingRecipes?.length )
			recipes = station.CraftingRecipes;
		else
			throw new Error('Your station has no recipes.');

		const new_station: BCStation = Stations[name] = {
			Id: name,
			IsCooking: cooking,
			Recipes: recipes
		};

		// Copy our flag.
		if ( station.ExclusiveRecipes != null )
			new_station.AreRecipesExclusive = station.ExclusiveRecipes;

		// Does this have a Big Craftable?
		if (station.BigCraftable )
			Changes.push({
				Action: 'EditData',
				Target: 'Data/BigCraftables',
				TargetField: [
					station.BigCraftable,
					'CustomFields'
				],
				Entries: {
					'leclair.bettercrafting_PerformAction': `leclair.bettercrafting_OpenMenu FALSE FALSE ${name}`
				}
			});
	}

	Changes.push({
		Action: 'EditData',
		Target: 'Mods/leclair.bettercrafting/CraftingStations',
		Entries: Stations
	});

	return {
		schema: {
			Format: '2.0.0',
			Changes
		} as CPSchema,

		generated: did_generate,
		tiles: Tiles
	};
}
