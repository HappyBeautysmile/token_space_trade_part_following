
// An owner is an entity (company, player, or NPC) which has a name and
// some money.
export class Owner {
  constructor(readonly name: string, private initalCredits: number) { }
}