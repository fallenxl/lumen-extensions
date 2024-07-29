export interface Field {
    name: string;
    keys: string[];
    unit: string;
}
export interface DataField {
    system: Field[],
    triphase: Field[],
}

export interface EntityRelation {
    to: {
        entityType: string,
        id: string
    },
    toName: string,
    relations: EntityRelation[]
    expanded?: boolean;
    label: string;
}