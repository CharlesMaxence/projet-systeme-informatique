"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [explication, setExplication] = useState("");
  const [titreExplication, setTitreExplication] = useState("");
  const [afficherExplication, setAfficherExplication] = useState(false);
  const [couleurAlerte, setCouleurAlerte] = useState("");
  const [score, setScore] = useState(0);
  const [joueurNom, setJoueurNom] = useState("");

  const [questionsRatees, setQuestionsRatees] = useState<any[]>([]);

  // TIMER
  const [timeLeft, setTimeLeft] = useState(10);
  const [timerActif, setTimerActif] = useState(true);

  const question = questions[questionIndex];
  const [joueurPret, setJoueurPret] = useState(false);

useEffect(() => {
  // On ne lance la récupération que si joueurPret est passé à 'true'
  if (joueurPret) {
    const userId = localStorage.getItem("supabase_user_id");
    if (userId) {
      supabase
        .from("joueur")
        .select("pseudo")
        .eq("user_id", userId)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Erreur lors de la récupération du joueur :", error);
          } else if (data) {
            setJoueurNom(data.pseudo);
          }
        });
    }
  }
}, []); 

  // Charger les questions depuis Supabase
  useEffect(() => {
    async function fetchQuestion() {
      const { data, error } = await supabase
        .from("question")
        .select(`
          id,
          texte,
          image_url,
          image_credit_nom,
          image_credit_url,
          explication,
          reponses:reponse (
            id,
            texte,
            est_correcte 
          )
        `)
        .order("id", { ascending: true });

      if (error) {
        console.error("Erreur Supabase :", error);
      } else {
        setQuestions(data || []);
      }
    }

    fetchQuestion();
  }, []);

  // Reset timer à chaque nouvelle question
  useEffect(() => {
    setTimeLeft(10);
    setTimerActif(true);
  }, [questionIndex]);

  // Timer
  useEffect(() => {
    if (!question || !timerActif) return;

    if (timeLeft === 0) {
      setTimerActif(false);

      // Ajouter question ratée
      setQuestionsRatees((prev) => [
        ...prev,
        {
          question: question.texte,
          explication: question.explication || "Vous n'avez pas répondu à temps."
        }
      ]);

      setAfficherExplication(true);
      setTitreExplication("Temps écoulé !");
      setExplication("Vous n'avez pas répondu à temps.");
      setCouleurAlerte("bg-red-50 border-red-300 text-red-800");

      setTimeout(() => {
        setAfficherExplication(false);
        setQuestionIndex((prev) => prev + 1);
      }, 3000);

      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, question, timerActif]);

  function handleClick(reponse: any) {
    if (!question || afficherExplication || timeLeft === 0) return;

    const estBonneReponse = reponse.est_correcte;

    setTimerActif(false);

    const titre = estBonneReponse ? "Bonne réponse !" : "Mauvaise réponse.";
    const explicationTexte = question.explication || titre;

    setTitreExplication(titre);
    setExplication(explicationTexte);

    setCouleurAlerte(
      estBonneReponse
        ? "bg-green-50 border-green-300 text-green-800"
        : "bg-red-50 border-red-300 text-red-800"
    );

    setAfficherExplication(true);

    if (!estBonneReponse) {
      setQuestionsRatees((prev) => [
        ...prev,
        {
          question: question.texte,
          explication: question.explication || "Pas d'explication disponible."
        }
      ]);
    }

    setTimeout(() => {
      setAfficherExplication(false);
      setTitreExplication("");
      setExplication("");

      if (estBonneReponse) setScore((prev) => prev + 1);

      setQuestionIndex((prev) => prev + 1);
    }, 4000);
  }

  // Fonction pour rejouer
  function resetQuiz() {
    setQuestionIndex(0);
    setScore(0);
    setQuestionsRatees([]);
    setTimeLeft(10);
    setTimerActif(true);
  }

  // Quiz terminé
  if (!question) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold">Quiz terminé !</h2>

        <p className="mt-4 text-lg">
          Score final : <span className="font-bold">{score}</span> / {questions.length}
        </p>

        {/* Questions ratées */}
        {questionsRatees.length > 0 ? (
          <div className="mt-10 max-w-2xl mx-auto text-left">
            <h3 className="text-xl font-semibold mb-4">Questions mal répondues :</h3>

            {questionsRatees.map((item, index) => (
              <div key={index} className="mb-6 p-4 border rounded bg-red-50">
                <p className="font-bold">❌ {item.question}</p>
                <p className="mt-2 text-sm text-gray-700">{item.explication}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-green-600 font-semibold">👏 Aucune erreur, bravo !</p>
        )}

        {/* Bouton rejouer */}
        <Button className="mt-6" onClick={resetQuiz}>
          Rejouer le quiz
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Alert className="bg-blue-50 border-blue-300 text-blue-800 max-w-xl mx-auto mt-6">
        <AlertTitle className="text-xl font-semibold">Bienvenue sur CyberQuiz</AlertTitle>
        <AlertDescription>
          Un quiz pour tester vos connaissances en cybersécurité.
        </AlertDescription>
      </Alert>

      <Alert className="bg-purple-50 border-purple-300 text-purple-800 max-w-xl mx-auto mt-6">
        <AlertTitle className="text-xl font-semibold">Score</AlertTitle>
        <AlertDescription>
          {score} bonne(s) réponse(s) sur {questions.length}
        </AlertDescription>
      </Alert>

      {questions.length > 0 ? (
        <Card className="max-w-4xl mx-auto mt-6">
          <div className="flex">

            {/* Colonne gauche */}
            <div className="w-1/2 p-4">
              {question.image_url ? (
                <Image
                  src={question.image_url}
                  alt="Illustration de la question"
                  width={400}
                  height={300}
                  className="rounded"
                />
              ) : (
                <div className="w-full h-[300px] bg-gray-100 flex items-center justify-center text-sm text-gray-500 rounded">
                  Aucune image disponible
                </div>
              )}

              {question.image_credit_nom && question.image_credit_url && (
                <Alert className="mt-4 text-sm text-muted-foreground">
                  <AlertDescription>
                    <span className="inline">
                      Image :{" "}
                      <Link
                        href={question.image_credit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-primary"
                      >
                        {question.image_credit_nom}
                      </Link>
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Colonne droite */}
            <div className="w-1/2 p-4">
              <CardHeader className="p-0 mb-4">
                <CardTitle>
                  <p className="text-sm mb-2">
                    Question {questionIndex + 1} sur {questions.length}
                  </p>
                </CardTitle>
              </CardHeader>

              <p className="text-right text-sm mb-2">
                Temps restant : <span className="font-bold">{timeLeft}s</span>
              </p>

              <CardContent className="p-0">
                <p className="text-lg font-semibold mb-4">{question.texte}</p>

                {question.reponses.map((reponse: any) => (
                  <Button
                    key={reponse.id}
                    onClick={() => handleClick(reponse)}
                    disabled={afficherExplication || timeLeft === 0}
                    className="w-full justify-start mt-2"
                    variant="outline"
                  >
                    {reponse.texte}
                  </Button>
                ))}
              </CardContent>

              {afficherExplication && (
                <Alert className={`mt-6 ${couleurAlerte}`}>
                  <AlertTitle className="font-bold">{titreExplication}</AlertTitle>
                  <AlertDescription>{explication}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <p className="text-center mt-6">Chargement des questions...</p>
      )}
    </div>
  );
}
