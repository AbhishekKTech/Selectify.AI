"use client"
import { createAssessSchema, CreateAssessSchema } from '@/lib/validation/dashboard'
import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { ArrowLeft, ArrowRight, Loader2, PlusCircle, Star, Trash, Upload } from 'lucide-react'
import { Automated_Assess } from '@prisma/client'
import LoadingButton from './ui/loading-btn'
import { Droppable, Draggable, DragDropContext, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import styled from '@emotion/styled';
import convertor from '@/lib/convertor'

type Props = {
    open: boolean,
    setOpen: (open: boolean) => void,
    toEdit?: Automated_Assess, 
    userName: string | null | undefined
}

interface StyledDraggableProps {
    isDragging: boolean;
}

const StyledDraggable = styled.div<StyledDraggableProps>`
    top: auto !important;
    left: auto !important;
    background-color: ${props => (props.isDragging ? '#e0e7ff' : 'transparent')};
    border-radius: 0.5rem;
    padding: ${props => (props.isDragging ? '0.5rem' : '0')};
    transition: background-color 0.2s ease;
`;

const NewAutomatedAssessment = ({ open, setOpen, toEdit, userName }: Props) => {
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [formStep, setFormStep] = React.useState(0);
    const [curateWithAILoading, setCurateWithAILoading] = useState(false);
    
    // Auto-fill Extractors State
    const [isExtracting, setIsExtracting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const router = useRouter();

    // FIXED: Added safe defaults for level, jobtype, and the static first question to prevent silent Zod validation blocks.
    const form = useForm<CreateAssessSchema>({
        resolver: zodResolver(createAssessSchema),
        defaultValues: {
            name: toEdit?.name || "",
            jobProfile: toEdit?.jobProfile || "",
            jobtype: toEdit?.jobtype || "Full-Time", 
            companyName: toEdit?.companyName || "",
            jobRequirements: toEdit?.jobRequirements || "",
            level: toEdit?.level || "2", 
            questions: toEdit?.questions?.length 
                ? toEdit.questions 
                : ["Please introduce yourself and talk about your previous experience."],
        },
    });   

    // ─── Unified Context Extraction Logic ──────────────────────────────
    const processExtraction = async (file: File) => {
        setIsExtracting(true);
        try {
            if (file.type === 'application/pdf') {
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch('https://pdf-text-extractor-api.onrender.com/extractText', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error('PDF extraction failed');
                const data = await response.json();
                
                if (data.text) {
                    const currentVal = form.getValues('jobRequirements');
                    const separator = currentVal ? "\n\n" : "";
                    form.setValue('jobRequirements', currentVal + separator + data.text, { shouldValidate: true });
                }
            } else if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                const text = await convertor(url);
                if (text) {
                    const currentVal = form.getValues('jobRequirements');
                    const separator = currentVal ? "\n\n" : "";
                    form.setValue('jobRequirements', currentVal + separator + text, { shouldValidate: true });
                }
            } else {
                alert("Please upload a valid Image or PDF file.");
            }
        } catch (error) {
            console.error("Extraction error:", error);
            alert("Failed to extract text from file.");
        } finally {
            setIsExtracting(false);
            if(fileInputRef.current) fileInputRef.current.value = ''; 
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processExtraction(file);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processExtraction(file);
    };
    // ───────────────────────────────────────────────────────────────────

    async function onSubmit(input: CreateAssessSchema) {
        try {
            if (toEdit) {
                const response = await fetch("/api/autoAssess", {
                  method: "PUT",
                  body: JSON.stringify({ id: toEdit.id, ...input }),
                });
                if (!response.ok) throw Error("Status code: " + response.status);
            } else {
                const response = await fetch("/api/autoAssess", {
                  method: "POST",
                  body: JSON.stringify(input),
                });
                if (!response.ok) throw Error("Status code: " + response.status);
                form.reset();
            }
            router.refresh();
            setOpen(false);
            setFormStep(0); 
        } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
        }
    }

    async function deleteEvent() {
        if (!toEdit) return;
        setDeleteInProgress(true);
        try {
          const response = await fetch("/api/autoAssess", {
            method: "DELETE",
            body: JSON.stringify({ id: toEdit.id }),
          });
          if (!response.ok) throw Error("Status code: " + response.status);
          router.refresh();
          setOpen(false);
        } catch (error) {
          console.error(error);
          alert("Something went wrong. Please try again.");
        } finally {
          setDeleteInProgress(false);
        }
    }

    const generateQuestion = async (index: number) => {
        setCurateWithAILoading(true);
        const { jobProfile, companyName, jobtype, jobRequirements, questions, level } = form.getValues();
        try {
          const response = await fetch('/api/generateQues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: {
                    queryType: 'generateQuestion',
                    jobProfile, companyName, jobtype, jobRequirements,
                    questions: questions.join('. '), level 
                },
            }),
          });
          if (!response.ok) throw new Error(`Failed to generate AI question. Status code: ${response.status}`);
          
          const generatedQuestion = await response.json();
          const generatedQuestionString = generatedQuestion.question;
          const newQuestions = [...form.getValues('questions')];
          newQuestions[index] = generatedQuestionString;
          form.setValue('questions', newQuestions);
        } catch (error) {
          console.error('Error generating AI question:', error);
        } finally {
            setCurateWithAILoading(false);
        }
    };
      
    async function onDragEnd(result: DropResult) {
        if (!result.destination) return;
        const newQuestions = [...form.getValues('questions')];
        const [movedQuestion] = newQuestions.splice(result.source.index, 1);
        newQuestions.splice(result.destination.index, 0, movedQuestion);
        form.setValue('questions', newQuestions);
    }

    const addQuestion = () => {
        const newQuestions = [...form.getValues('questions'), ''];
        form.setValue('questions', newQuestions);
    };

    const removeQuestion = (index: number) => {
        const newQuestions = [...form.getValues('questions')];
        newQuestions.splice(index, 1);
        form.setValue('questions', newQuestions);
    };    
    
    const diflevel = (value: string) => {
        const intValue = parseInt(value, 10);
        switch (intValue) {
            case 1: return 'Beginner';
            case 2: return 'Intermediate';
            case 3: return 'Expert/Hard';
            default: return 'Intermediate';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-white">
                        {toEdit ? "Edit Automated Assessment" : "Host Automated Assessment"}
                    </DialogTitle>
                </DialogHeader>
                
                {/* Hidden unified file input */}
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                />

                <Form {...form}>
                    <form 
                        className='space-y-4' 
                        onSubmit={form.handleSubmit(onSubmit, (errors) => {
                            console.error("Validation Blocked Submission:", errors);
                        })}
                    >
                        <div className={cn('space-y-4', { hidden: formStep == 1 })}>
                            <FormField control={form.control} name='name' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Assessment Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder='e.g. Senior Frontend Developer Interview' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name='jobProfile' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Career Profile</FormLabel>
                                        <FormControl>
                                            <Input placeholder='Frontend Engineer' {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="jobtype" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employment Title</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select Employment Title" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['Internship', 'Part-Time', 'Full-Time', 'Contract'].map((title) => (
                                                    <SelectItem value={title.toString()} key={title}>{title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={form.control} name='companyName' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company Details</FormLabel>
                                    <FormControl>
                                        <Input placeholder='Company Name' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            {/* Prominent Drag & Drop Zone for Auto-fill */}
                            <FormField control={form.control} name='jobRequirements' render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-base font-semibold">Profile Requirements (Job Description)</FormLabel>
                                    
                                    <div
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                        onDrop={onDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={cn(
                                            "mt-2 mb-4 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
                                            isDragOver ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800",
                                            isExtracting && "opacity-80 pointer-events-none"
                                        )}
                                    >
                                        {isExtracting ? (
                                            <div className="flex flex-col items-center gap-3 text-indigo-600 dark:text-indigo-400">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="text-sm font-medium">Extracting text using AI...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-1">
                                                    <Upload className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                    Click to upload or drag and drop
                                                </p>
                                                <p className="text-xs text-center">
                                                    Upload a JD, Resume Image, or PDF to auto-fill requirements.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <FormControl>
                                        <Textarea className='h-36 resize-none' placeholder="Or type manually: Key skills required (e.g. React, Next.js, TypeScript)..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name='level' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Difficulty Level Of Interview <span className='text-indigo-600 font-semibold'>({diflevel(field.value)})</span></FormLabel>
                                    <FormControl>
                                        <Input className='cursor-pointer accent-indigo-600' min={1} max={3} type="range" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className={cn('space-y-4', { hidden: formStep == 0 })}>
                            <FormField control={form.control} name='questions' render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between mb-4">
                                        <FormLabel className="text-lg">Questions</FormLabel>
                                        <Button className='bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200' size="sm" type="button" onClick={addQuestion}>
                                            <PlusCircle className="w-4 h-4 mr-2" /> Add Question
                                        </Button>
                                    </div>
                                    <DragDropContext onDragEnd={onDragEnd}>
                                        <Droppable droppableId="quesId">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                    {form.getValues('questions').map((question, index) => (
                                                        <Draggable key={index} draggableId={`question-${index}`} index={index}>
                                                            {(provided, snapshot) => (
                                                                <StyledDraggable
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    isDragging={snapshot.isDragging}
                                                                    ref={provided.innerRef}
                                                                    className="bg-white dark:bg-card border border-border p-4 rounded-lg shadow-sm"
                                                                >
                                                                    <FormItem>
                                                                        <FormLabel className="text-slate-500">Question {index + 1}</FormLabel>
                                                                        <div className='flex flex-col gap-3'>
                                                                            <FormControl>
                                                                                <Textarea
                                                                                    className='resize-none focus-visible:ring-indigo-500'
                                                                                    placeholder={`Enter question ${index + 1}`}
                                                                                    value={question}
                                                                                    onChange={(e) => {
                                                                                        const newQuestions = [...form.getValues('questions')];
                                                                                        newQuestions[index] = e.target.value;
                                                                                        form.setValue('questions', newQuestions);
                                                                                    }}
                                                                                />
                                                                            </FormControl>
                                                                            <div className='flex flex-row justify-end gap-2'>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    className={cn(
                                                                                        'text-indigo-600 border-indigo-200 hover:bg-indigo-50',
                                                                                        { 'opacity-60 cursor-not-allowed': curateWithAILoading }
                                                                                    )}
                                                                                    type="button"
                                                                                    onClick={() => { if (!curateWithAILoading) generateQuestion(index); }}
                                                                                >
                                                                                    {curateWithAILoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2" />}
                                                                                    Curate with AI
                                                                                </Button>
                                                                                <Button variant="ghost" size="sm" className='text-red-500 hover:text-red-700 hover:bg-red-50' type="button" onClick={() => removeQuestion(index)}>
                                                                                    <Trash className="w-4 h-4 mr-2" /> Remove
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                        <FormMessage />
                                                                    </FormItem>
                                                                </StyledDraggable>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter className='w-full gap-2 pt-6 flex-col sm:flex-row justify-between border-t border-border mt-6'>
                            <div className="flex w-full justify-start">
                                {toEdit && (
                                    <LoadingButton
                                        className='bg-red-500 hover:bg-red-600 text-white rounded-lg px-4'
                                        loading={deleteInProgress}
                                        disabled={form.formState.isSubmitting}
                                        onClick={deleteEvent}
                                        type="button"
                                    >
                                        Delete Assessment
                                    </LoadingButton>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <Button
                                    type='button'
                                    variant="outline"
                                    onClick={() => setFormStep(0)}
                                    className={cn('', { hidden: formStep == 0 })}
                                >
                                    <ArrowLeft className='w-4 h-4 mr-2' /> Profile Info
                                </Button>
                                
                                <Button
                                    type='button'
                                    onClick={async () => {
                                        const valid = await form.trigger(['name', 'jobProfile', 'companyName', 'jobtype', 'jobRequirements']);
                                        if (valid) setFormStep(1);
                                    }}
                                    className={cn('bg-indigo-600 hover:bg-indigo-700 text-white', { hidden: formStep == 1 })}
                                >
                                    Questions <ArrowRight className='w-4 h-4 ml-2' />
                                </Button>

                                <Button className={cn('bg-indigo-600 hover:bg-indigo-700 text-white', { hidden: formStep == 0 })} type='submit'>
                                    {form.formState.isSubmitting && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
                                    Submit
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default NewAutomatedAssessment