"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import NewAutomatedAssessment from './NewAutomatedAssessment';

interface props {
  userName : string | null | undefined
}

export default function AutomatedAssessmentButton({userName}:props) {
  const [addDialog, setAddDialog] = useState(false);
  const name = userName;
  
  return (
    <>
        <Button 
          className='bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all font-medium' 
          onClick={()=>setAddDialog(true)}
        >
          Host Assessment
        </Button>
        <NewAutomatedAssessment userName={name} open={addDialog} setOpen={setAddDialog}/>
    </>    
  )
}