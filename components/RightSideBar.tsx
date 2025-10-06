import React, { useState } from 'react'
import { Plus, Clock, Paperclip } from 'lucide-react';
import { useModal } from "@/context/ModalContext";

const RightSideBar = () => {
    const { isModalOpen, openModal, closeModal } = useModal();

    return (
        <div className="flex-[1] flex flex-col min-w-[220px] h-full gap-6 rounded-lg p-10 shadow-lg">
            {/* add project */}
            <div 
                className='flex justify-center relative items-center bg-[#4D3BED] p-2 px-10 text-white rounded-xl cursor-pointer'
                onClick={openModal}
            >
                <p className='absolute left-4'><Plus size={20} className='text-white'/></p>
                <p>Add project</p>
            </div>
            <div className='flex justify-between items-center border-b border-[#e0e0e0] pb-2'>
                <p>Finished projects</p>
                <p>3</p>
            </div>
            <div className='flex justify-between items-center border-b border-[#e0e0e0] pb-2'>
                <p>Projects in progress</p>
                <p>3</p>
            </div>
            <div className='flex justify-between items-center border-b border-[#e0e0e0] pb-2'>
                <p>Overall project time</p>
                <p>16h</p>
            </div>

            {/* projects over view */}
            <div className='text-sm'>
                <p>Over view</p>
            </div>
            <div className='w-full flex flex-col gap-2 p-2 rounded-xl border border-[#e0e0e0]'>
                <div className='flex justify-between items-center'>
                <div>
                    <p>Qualtrics</p>
                    <p>Web dev</p>
                </div>
                <div className='flex flex-row justify-center gap-2 items-center'>
                    <div className='w-[8px] h-[8px] bg-yellow-600'></div>
                    <p>New</p>
                    <input type="checkbox" name="" id="" className='m-0 p-0'/>
                </div>
                </div>
                <div className='flex justify-between items-center'>
                <div className='flex flex-row items-center'><Clock size={12}/><p className='text-sm'>16h</p></div>
                <div className='flex gap-2 flex-row items-center'><Paperclip size={12}/><p className='text-sm'>3 attachments</p></div>
                </div>
            </div>
            <div className='w-full flex flex-col gap-2 p-2 rounded-xl border border-[#e0e0e0]'>
                <div className='flex justify-between items-center'>
                <div>
                    <p>Qualtrics</p>
                    <p>Web dev</p>
                </div>
                <div className='flex flex-row justify-center gap-2 items-center'>
                    <div className='w-[8px] h-[8px] bg-yellow-600'></div>
                    <p>New</p>
                    <input type="checkbox" name="" id="" className='m-0 p-0'/>
                </div>
                </div>
                <div className='flex justify-between items-center'>
                <div className='flex flex-row items-center'><Clock size={12}/><p className='text-sm'>16h</p></div>
                <div className='flex gap-2 flex-row items-center'><Paperclip size={12}/><p className='text-sm'>3 attachments</p></div>
                </div>
            </div>
        </div>
    )
}

export default RightSideBar
