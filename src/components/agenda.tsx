import {TextEffect} from "@/components/motion-primitives/text-effect";
import React from "react";
import {transitionVariants} from "@/lib/animations";
import {AnimatedGroup} from "@/components/motion-primitives/animated-group";

export default function Agenda() {
    return (
        <section className="scroll-py-16 py-16 md:scroll-py-32 md:py-32">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid gap-y-12 px-2 lg:grid-cols-[1fr_auto]">
                    <div className="text-center lg:text-left">
                        <TextEffect
                            triggerOnView
                            preset="fade-in-blur"
                            speedSegment={0.3}
                            as="h2"
                            className="mb-4 text-3xl font-semibold md:text-4xl">
                            Agenda
                        </TextEffect>
                    </div>

                    <AnimatedGroup
                        triggerOnView
                        variants={{
                            container: {
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05,
                                        delayChildren: 0.75,
                                    },
                                },
                            },
                            ...transitionVariants,
                        }}
                        className="divide-y divide-dashed sm:mx-auto sm:max-w-lg lg:mx-0"
                    >
                        <div className="pb-6">
                            <div className="font-medium space-x-2">
                                <span className='text-muted-foreground font-mono '>09:00</span>
                                <span>Registration & Setup</span>
                            </div>
                            <p className="text-muted-foreground mt-4">Check in, set up your prototype at your assigned stall, and get your lanyard.</p>
                        </div>
                        <div className="py-6">
                            <div className="font-medium space-x-2">
                                <span className='text-muted-foreground font-mono '>10:00</span>
                                <span>Inauguration & Keynote</span>
                            </div>
                            <p className="text-muted-foreground mt-4">Opening ceremony with keynote from industry leaders and chief guests.</p>
                        </div>
                        <div className="py-6">
                            <div className="font-medium space-x-2">
                                <span className='text-muted-foreground font-mono '>11:00</span>
                                <span>Judging Rounds</span>
                            </div>
                            <p className="text-muted-foreground mt-4">Present your prototype to judges. Smart scheduling ensures fair evaluation for all teams.</p>
                        </div>
                        <div className="py-6">
                            <div className="font-medium space-x-2">
                                <span className='text-muted-foreground font-mono '>15:00</span>
                                <span>Awards & Closing</span>
                            </div>
                            <p className="text-muted-foreground mt-4">Award ceremony, networking, and celebration of innovation and creativity.</p>
                        </div>
                    </AnimatedGroup>
                </div>
            </div>
        </section>
    )
}
