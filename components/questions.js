import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';

import { Card, ListItem } from 'react-native-elements';
import firebase from 'firebase';
import { Loading } from './LoadingComponent';


var i=1;

function DisplayList(props) {
    const details = {
        ques: props.question
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
    
    const fetchquestions = () => {
        var art=[];
        db.collection('questions').orderBy('date', 'desc').limit(20).get().then((snapshot)=> {
            snapshot.docs.map((doc) => {
                db.collection('users').where('phno', '==', doc.data().mobile).get().then((snapshot)=> {
                    art.push(
                        {
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
                    )
                })
                .then(()=> {
                    updateItems(40);
                    updateArt(art);
                })
                .catch((err)=> {
                    console.log(err);
                })
            })
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
            db.collection('questions').orderBy('timestamp', 'desc').limit(items).get().then((snapshot)=> {
                snapshot.docs.map((doc) => {
                    db.collection('users').where('phno', '==', doc.data().mobile).get().then((snapshot)=> {
                        art.push(
                            {
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
                        )
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
                })
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
                        questions?questions.map((item) => <DisplayList question={item} propsc={props} />):<Loading />
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