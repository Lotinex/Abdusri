import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";
@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    date: Date;

    @Column()
    userid: string;

    @Column()
    iron: number;

    @Column()
    gold: number;

    @Column()
    lv: number;

    @Column()
    lastMinig: string;

    @Column()
    lor: number;

    @Column("json")
    inventory: Partial<Minecraft.Inventory>;

    @Column()
    exp: number;

    @Column()
    rank: string;

}
