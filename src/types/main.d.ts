declare namespace Minecraft {
    type itemRares = "common" | "rare" | "epic" | "legendary" | "mythic"
    type toolType = "sword" | "pickaxe" | "axe" | "shovel" | "hoe" | "bow"
    type enchantments = {
        sword : number;
        hoe : number;
    }
    type tool<T extends toolType> = {
        durability : [number, number];
        enchant : {[enchantID:string] : number}; //나중에 제네릭 T에 의해 도구에 따라 인챈트가 제한되도록 하자.
        rare : itemRares;
        damage : number;
    }
    type normalItem = {
        rare : itemRares;
        num : number;
    }
    type items = {
        'iron' : normalItem;
        'gold' : normalItem;
        'diamond_sword' : tool<"sword">;
        '루난의 허리케인' : tool<"bow">;
    }
    type Inventory = {
        [itemKey in keyof items]: items[itemKey];
    }
    /*type R = keyof enchantments
    type itemObj = {
        durability : number;
        isEnchanted : boolean;
        enchant : Array<[R, enchantments[R]]>;
    }
    type inventory = {
        [itemKey in keyof items]: itemObj[];
    }*/
}
declare namespace Util {
    type Loose<T> = {
        [P in keyof T]?: Loose<T[P]>;
    };    
}

type UserInventory = {
    [itemkey:string] : {
        rare:string;
        price:number|null;
        
    }
}
type CPLMinifyObject = Array<{
    [key:string] : {
        name:string;
        date:Date;
        permission:string;
        lv:number;
    }
}>
type MinecraftRecipe = {
    [key:string] : [string, "gif"?];
}
