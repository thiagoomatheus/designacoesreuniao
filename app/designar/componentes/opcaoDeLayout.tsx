export default function OpcaoDeLayout( { quantidadeDeSemanas }: {quantidadeDeSemanas: number}) {
    return (
        <label className="flex flex-col justify-start items-center cursor-pointer gap-5">
            <p className="font-bold">{quantidadeDeSemanas === 1 ? 'Único' : quantidadeDeSemanas === 2 ? 'Quinzenal' : 'Mensal'}</p>
            <div className="w-32 h-48 border border-black dark:border-white flex flex-col gap-1 p-1 justify-between">
                <div className={`h-full border border-black dark:border-white`}></div>
                <div className={`${quantidadeDeSemanas === 1 ? "" : "border"} h-full border-black dark:border-white`}></div>
                <div className={`${quantidadeDeSemanas === 1 ? "" : quantidadeDeSemanas === 2 ? "" : "border"} h-full border-black dark:border-white`}></div>
                <div className={`${quantidadeDeSemanas === 1 ? "" : quantidadeDeSemanas === 2 ? "" : "border"} h-full border-black dark:border-white`}></div>
            </div>
            <input className="bg-yellow-500 p-2 rounded-lg text-white shadow-lg font-bold cursor-pointer" required type="radio" name="layout" value={quantidadeDeSemanas === 1 ? 'unico' : quantidadeDeSemanas === 2 ? 'quinzenal' : 'mensal_padrao'} />
        </label>
    )
}