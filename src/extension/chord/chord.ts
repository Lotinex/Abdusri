import * as Discord from 'discord.js'
import * as fs from 'fs'
export class Chord extends Discord.Client {

    public prefix : string;

    constructor(prefix :string = "!"){
        super()
        this.prefix = prefix
    }
    public setCommand(command: string, executeFunction: chord.commandExecuteFunction):void {
        this.on('message', msg => executeFunction(msg))
    }
}
