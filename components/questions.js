import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';

import { Card, ListItem } from 'react-native-elements';
import firebase from 'firebase';
import { Loading } from './LoadingComponent';
import { Button } from 'react-native';


var i=1;

function DisplayList(props) {
    const details = {
        ques: props.question,
        user: props.propsc.route.params
    }
    return (
        <TouchableOpacity
            onPress={()=> props.propsc.navigation.navigate('question', details)}
        >
            <ListItem key={i++} 
                bottomDivider
            >
                <Image 
                    source={
                        props.question.user.photo?
                        {uri: props.question.user.photo}:
                        require('./images/user.png')
                    }
                    style={{
                        height: 50,
                        width: 50
                    }} 
                />
                <ListItem.Content>
                <ListItem.Title>{props.question.question}</ListItem.Title>
                </ListItem.Content>
                <ListItem.Chevron />
            </ListItem>
        </TouchableOpacity>
    )
}

export default function AllQuestions(props) {
    let [questions, updateArt] = React.useState(null);
    let [items, updateItems] = React.useState(20);
    let [refreshing, setRefreshing] = React.useState(false);
    let [reachedEnd, setEnd] = React.useState(false);
    let [loading, setLoading] = React.useState(false);
    const db = firebase.firestore();

    React.useEffect(() => {
        if(!questions) {
            fetchquestions();
        }
    }, []);

    const onRefresh = async () => {
        i=1;
        setEnd(false);
        console.log(items);
        setRefreshing(true);
        updateArt(null);
        await fetchquestions();
        setRefreshing(false);
    }
    
    const fetchquestions = () => { // function to fetch latest 20 questions in descending order of date they were posted on
        var art=[];
        db.collection('questions').orderBy('date', 'desc').limit(20).get().then(async (snapshot)=> { //fetching top 20 questions in descending order from the database
            if(snapshot.docs.length) { // checking if database is not empty...
                art = await Promise.all(snapshot.docs.map(async (doc) => {
                    await db.collection('users').where('phno', '==', doc.data().mobile).get().then((snapshot)=> {
                        //firebase firestore query is used here to get the user information from the database
                        art={
                                question: doc.data().question,
                                qid: doc.data().qid,
                                mobile: doc.data().mobile,
                                user: {
                                    photo: snapshot.docs[0].data().photo,
                                    mobile: doc.data().mobile,
                                    dob: snapshot.docs[0].data().dob?new Date(snapshot.docs[0].data().dob.seconds * 1000):null,
                                    lol: snapshot.docs[0].data().lol,
                                    gender: snapshot.docs[0].data().gender,
                                    name: snapshot.docs[0].data().name,
                                    email: snapshot.docs[0].data().email
                                }
                            }
                    })
                    .catch((err)=> {
                        console.log(err);
                    })
                    return art;
                }))
            }
        })
        .then (()=> {
            updateArt(art) // the question state is updated here so that component will refresh and shows the updated data
        })
        .catch((err)=> {
            console.log(err);
        })
    }

    
    const fetchMorequestions = () => {
        if(!reachedEnd && !loading) {
            setLoading(true);
            updateItems(items+20);
            console.log(items);
            var art=[];
            db.collection('questions').orderBy('date', 'desc').limit(items).get().then(async (snapshot)=> {
                if(snapshot.docs.length) {
                    art = await Promise.all(snapshot.docs.map(async (doc) => {
                        await db.collection('users').where('phno', '==', doc.data().mobile).get().then((snapshot)=> {
                            art = {
                                    question: doc.data().question,
                                    qid: doc.data().qid,
                                    mobile: doc.data().mobile,
                                    user: {
                                        photo: snapshot.docs[0].data().photo,
                                        mobile: doc.data().mobile,
                                        dob: snapshot.docs[0].data().dob?new Date(snapshot.docs[0].data().dob.seconds * 1000):null,
                                        lol: snapshot.docs[0].data().lol,
                                        gender: snapshot.docs[0].data().gender
                                    }
                                }
                            
                        })
                        .catch((err)=> {
                            console.log(err);
                        })
                        return art;
                    }))
                }
            })
            .then(()=> {
                updateArt(art);
                setLoading(false);
                if(art.length< items) {
                    setEnd(true);
                }
            })
            .catch((err)=> {
                console.log(err);
            })
        }
    }
    const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 0;
        return (layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom)&&questions;
    };

    return(
        <>
            <View
                style={{
                    width: '100%',
                    alignItems: 'center',
                    marginTop: 20
                }}
            >
                <Button
                    title= "Add A New Question"
                    onPress={()=> props.navigation.navigate('questionAdd', props.route.params)}

                />
            </View>
            <ScrollView
                onScroll={({nativeEvent}) => {
                    if (isCloseToBottom(nativeEvent)) {
                        fetchMorequestions();
                    }
                }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <Card containerStyle={{padding: 0}} >
                    {
                        questions?questions.length?questions.map((item) => <DisplayList question={item} propsc={props} />):<Text>No Questions Yet...</Text>:<Loading />
                    }
                </Card>
                <View
                    style={{
                        display: !reachedEnd?'none':'flex',
                        width: '100%',
                        bottom: 0,
                        backgroundColor: '#229'
                    }}
                >
                    <Text style={{
                        color: '#fff',
                        textAlign: 'center'
                    }}>
                        You have reached the end
                    </Text>
                </View>
            </ScrollView>
            <View
                style={{
                    display: !loading?'none':'flex',
                    justifyContent: 'center',
                    bottom: 20,
                    backgroundColor: '#229'
                }}
            >
                <Loading />
            </View>
        </>
    )
}
