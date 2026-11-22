import Image from "next/image";

export function Logo(){
    return(
         <span className="flex items-center gap-2">
            <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={143} className="h-12 w-auto dark:hidden" priority />
            <Image src="/assets/img/logo-dark-wordmark.png" alt="ZARASOA" width={620} height={143} className="hidden h-12 w-auto dark:block" priority />
        </span>
    )
}
export function LogoSmart(){
    return(
        <span className="flex items-center gap-2">
            <Image src="/assets/img/logo-light-icon.png" alt="" width={520} height={300} className="h-7 w-auto sm:h-8 dark:hidden" priority />
            <Image src="/assets/img/logo-dark-icon.png" alt="" width={520} height={307} className="hidden h-7 w-auto sm:h-8 dark:block" priority />
            <Image src="/assets/img/logo-light-wordmark.png" alt="ZARASOA" width={620} height={138} className="h-5 w-auto sm:h-6 dark:hidden" priority />
            <Image src="/assets/img/logo-dark-wordmark.png" alt="ZARASOA" width={620} height={143} className="hidden h-5 w-auto sm:h-6 dark:block" priority />
        </span>
    )
}