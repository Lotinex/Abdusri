declare namespace chord {
    type Loose<T> = {
        [P in keyof T]?: Loose<T[P]>;
    };
    type commandExecuteFunction = (message: import('discord.js').Message) => void   
}