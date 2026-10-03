"use client"
import { createAssessSchema, CreateAssessSchema } from '@/lib/validation/dashboard'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogTitle, DialogContent, DialogFooter, DialogHeader } from './ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from './ui/button'
import { ArrowLeft, ArrowRight, Loader2, PlusCircle, Star, Trash, Lock } from 'lucide-react'
import { Assess } from '@prisma/client'
import LoadingButton from './ui/loading-btn'
import { Droppable, Draggable, DragDropContext, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import styled from '@emotion/styled';

type Props = {
    open: boolean,
    setOpen: (open: boolean) => void,
    toEdit?: Assess, 
    searchParams?: {
        id: string,
        jobProfile: string,
        jobType: string,
        companyName: string,
        jobRequirements: string,
    } 
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

const NewAssessment = ({ open, setOpen, toEdit }: Props) => {
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [formStep, setFormStep] = React.useState(0);
    const [curateWithAILoading, setCurateWithAILoading] = useState(false);
    const router = useRouter();

    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const jobProfile = searchParams.get('jobProfile');
    const jobType = searchParams.get('jobType');
    const companyName = searchParams.get('companyName');
    const jobRequirements = searchParams.get('jobRequirements');

    // Permanent Intro Question Text
    const introQuestion = "Could you please briefly introduce yourself and share a bit about your background?";

    const form = useForm<CreateAssessSchema>({
        resolver: zodResolver(createAssessSchema),
        defaultValues: {
            name: toEdit?.name || "",
            jobProfile: toEdit?.jobProfile || jobProfile || "",
            jobtype: toEdit?.jobtype || jobType || "Full-Time", 
            companyName: toEdit?.companyName || companyName || "",
            jobRequirements: toEdit?.jobRequirements || jobRequirements || "",
            level: toEdit?.level || "1", 
            // FIX: Minimum 3 items array to satisfy Zod schema right from the start
            questions: toEdit?.questions?.length ? toEdit.questions : [introQuestion, "", ""],
        },
    });

    async function onSubmit(input: CreateAssessSchema) {
        try {
            if (toEdit) {
                const response = await fetch("/api/assess", {
                  method: "PUT",
                  body: JSON.stringify({
                    id: toEdit.id,
                    ...input,
                  }),
                });
                if (!response.ok) throw Error("Status code: " + response.status);
            } else {
                const response = await fetch("/api/assess", {
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
            alert("Something went wrong, Please try again.");
        }
    }

    async function deleteEvent() {
        if (!toEdit) return;
        setDeleteInProgress(true);
        try {
          const response = await fetch("/api/assess", {
            method: "DELETE",
            body: JSON.stringify({
              id: toEdit.id,
            }),
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
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: {
                    queryType: 'generateQuestion',
                    jobProfile: jobProfile,
                    companyName: companyName,
                    jobtype: jobtype,
                    jobRequirements: jobRequirements,
                    questions: questions.join('. '),
                    level: level 
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
        if (result.source.index === 0 || result.destination.index === 0) return;

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
                        {toEdit ? "Edit Assessment" : "Self Assessment Setup"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form 
                      className='space-y-4' 
                      onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("🚨 ZOD VALIDATION ERRORS:", errors);
                      })}
                    >
                        <div className={cn('space-y-4', { hidden: formStep == 1 })}>
                            <FormField control={form.control} name='name' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Name</FormLabel>
                                    <FormControl><Input placeholder='Interviewee Name' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name='jobProfile' render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Career Profile</FormLabel>
                                        <FormControl><Input placeholder='Assistant Engineer' {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="jobtype" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employment Title</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Select Your Employment Title" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {['Internship', 'Part-Time', 'Full-Time', 'Contract', jobType || 'Cohort'].map((title) => (
                                                    <SelectItem value={title!.toString()} key={title}>{title}</SelectItem>
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
                                    <FormControl><Input placeholder='Apple.Inc' {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name='jobRequirements' render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Profile Requirement</FormLabel>
                                    <FormControl>
                                        <Textarea className='h-48 resize-none' placeholder="Strong MERN development experience for 5+ years..." {...field} />
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
                            <FormField control={form.control} name='questions' render={() => (
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
                                                    {form.getValues('questions').map((question, index) => {
                                                        const isIntro = index === 0; 
                                                        return (
                                                            <Draggable key={index} draggableId={`question-${index}`} index={index} isDragDisabled={isIntro}>
                                                                {(provided, snapshot) => (
                                                                    <StyledDraggable
                                                                        {...provided.draggableProps}
                                                                        {...(isIntro ? {} : provided.dragHandleProps)}
                                                                        isDragging={snapshot.isDragging}
                                                                        ref={provided.innerRef}
                                                                        className={cn("bg-white dark:bg-card border border-border p-4 rounded-lg shadow-sm", {
                                                                            "bg-gray-50 dark:bg-gray-900 border-indigo-200": isIntro 
                                                                        })}
                                                                    >
                                                                        <FormItem>
                                                                            <FormLabel className="text-slate-500 flex items-center">
                                                                                {isIntro ? (
                                                                                    <><Lock className="w-3 h-3 mr-2" /> Question 1 (Fixed Introduction)</>
                                                                                ) : (
                                                                                    `Question ${index + 1}`
                                                                                )}
                                                                            </FormLabel>
                                                                            <div className='flex flex-col gap-3'>
                                                                                <FormControl>
                                                                                    <Textarea
                                                                                        className={cn('resize-none focus-visible:ring-indigo-500', {
                                                                                            'cursor-not-allowed opacity-80 focus-visible:ring-0': isIntro
                                                                                        })}
                                                                                        placeholder={`Enter question ${index + 1}`}
                                                                                        value={question}
                                                                                        readOnly={isIntro}
                                                                                        onChange={(e) => {
                                                                                            if (isIntro) return; 
                                                                                            const newQuestions = [...form.getValues('questions')];
                                                                                            newQuestions[index] = e.target.value;
                                                                                            form.setValue('questions', newQuestions);
                                                                                        }}
                                                                                    />
                                                                                </FormControl>
                                                                                {!isIntro && (
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
                                                                                            {curateWithAILoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Star className="w-4 h-4 mr-2"/>}
                                                                                            Curate with AI
                                                                                        </Button>
                                                                                        <Button variant="ghost" size="sm" className='text-red-500 hover:text-red-700 hover:bg-red-50' type="button" onClick={() => removeQuestion(index)}>
                                                                                            <Trash className="w-4 h-4 mr-2"/> Remove
                                                                                        </Button>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <FormMessage />
                                                                        </FormItem>
                                                                    </StyledDraggable>
                                                                )}
                                                            </Draggable>
                                                        )
                                                    })}
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
                                        Delete Event
                                    </LoadingButton>
                                )}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <Button type='button' variant="outline" onClick={() => { setFormStep(0) }} className={cn('', { hidden: formStep == 0 })}>
                                    <ArrowLeft className='w-4 h-4 mr-2'/> Profile Info.
                                </Button>
                                
                                <Button 
                                    type='button' 
                                    onClick={async () => {
                                        const isValid = await form.trigger(['name', 'jobProfile', 'jobtype', 'companyName', 'jobRequirements', 'level']);
                                        if (isValid) {
                                            setFormStep(1);
                                        }
                                    }} 
                                    className={cn('bg-indigo-600 hover:bg-indigo-700 text-white', { hidden: formStep == 1 })}
                                >
                                    Questions <ArrowRight className='w-4 h-4 ml-2'/>
                                </Button>

                                <Button className={cn('bg-indigo-600 hover:bg-indigo-700 text-white', { hidden: formStep == 0 })} type='submit'>
                                    {form.formState.isSubmitting && <Loader2 className='w-4 h-4 animate-spin mr-2'/>}
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

export default NewAssessment;