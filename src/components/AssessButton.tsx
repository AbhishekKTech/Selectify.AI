"use client"
import React, { useState } from 'react'
import { Button } from './ui/button'
import NewAssessment from './NewAssessment';

export default function AssessButton() {
  const [addDialog, setAddDialog] = useState(false);
  
  return (
    <>
        <Button 
          className='bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow-sm transition-all font-medium mt-2' 
          onClick={()=>setAddDialog(true)}
        >
          New Assessment
        </Button>
        <NewAssessment open={addDialog} setOpen={setAddDialog}/>
    </>    
  )
}