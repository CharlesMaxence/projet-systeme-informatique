"use client"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [question, setQuestion] = useState<any>(null);
  useEffect(() => {
        async function fetchQuestion() {
            const { data, error } = await supabase
        .from('question')
        .select(`
          id,
          texte,
          reponses:reponse (
            id,
            texte,
            est_correcte
          )
        `)
        .order('id', { ascending: true });

      if (error) console.error(error);
      else setQuestion(data[0]); // On stocke la première question dans l’état
    }

    fetchQuestion();
  }, []);

  function handleClick(reponse: any) {
  if (reponse.est_correcte) {
    alert("Bonne réponse !");
  } else {
    alert("Mauvaise réponse.");
  }
}

  return (
  <div>
    <Alert className="max-w-xl mx-auto mt-4">
  <AlertTitle>Bienvenue sur CyberQuiz</AlertTitle>
  <AlertDescription>
    Préparez-vous à tester vos connaissances !
  </AlertDescription>
</Alert>

    {question ? (
  <Card className="max-w-xl mx-auto mt-6">
    <CardHeader>
      <CardTitle>Question</CardTitle>
    </CardHeader>
    <CardContent>
      <p>{question.texte}</p>

{question.reponses.map((reponse: any) => (
   <Button
      key={reponse.id}
      onClick={() => handleClick(reponse)}
      className="w-full justify-start mt-4"
      variant="outline"
      >
      {reponse.texte}
   </Button>
))}


    </CardContent>
  </Card>
) : (
  <p>Chargement de la question...</p>
)}

  </div>
);
}