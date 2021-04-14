import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, Image } from 'react-native';
import firebase from 'firebase';
import { Loading } from './LoadingComponent';
import { TextInput } from 'react-native';
import { Button } from 'react-native';


export default function questionDisp(props) {
    const db = firebase.firestore();
    const ques= props.route.params.ques;
    const navigate = props.navigation.navigate;
    let [answers, updateAns] = React.useState(null);
    let [newAnswer, updateNewAns] = React.useState(null);
    let [fetched, updateFetch] = React.useState(false);
    let [sub, updateSub] = React.useState(false);

    const Answers = (props) => {
        const fetchAnswers = async () => {
            updateFetch(false);
            var user= {
                initialInfo: 'initial property'
            };
            var main= [];
            await db.collection('answers').where('qid', '==', props.ques.qid).get().then(async (snapshot)=> {
                main = snapshot.docs[0]?await Promise.all(snapshot.docs[0].data().username_and_answers.map(async (data)=> {
                    await db.collection('users').where('phno', '==', data.mobile).get().then((snapshot)=> {
                        user= {
                            dob: snapshot.docs[0].data().dob,
                            email: snapshot.docs[0].data().email,
                            name: snapshot.docs[0].data().name,
                            mobile: snapshot.docs[0].data().phno,
                            photo: snapshot.docs[0].data().photo,
                            gender: snapshot.docs[0].data().gender,
                            lol: snapshot.docs[0].data().lol
                        }
                    })
                    .catch(err=> {
                        console.log(err)
                    })
                    main = {
                        userInfo: user,
                        answer: data.answer,
                        selected: data.selected
                    }
                    return main;
                })):null;
            })
            .then(async ()=> {
                if(main) {
                    for(var i=0; i<main.length; i++) {
                        if(main[i].selected) {
                            var temp = main[0];
                            main[0] = {
                                userInfo: main[i].user,
                                answer: main[i].answer,
                                selected: main[i].selected
                            };
                            main[i]= temp;
                        }
                    }
                }
            })
            .then(()=> {
                    updateFetch(true);
                    updateAns(main);
                }
            )
            .catch((err)=> {
                console.log(err);
            })
        }

        React.useEffect(() => {
            if(!answers && !fetched) {
                fetchAnswers();
            }
        }, []); //replecating componentDidMount Behaviour
        const handlePress = () => {
            console.log('I am called')  
        }

        if(answers) {
            return (
                <ScrollView>
                    {
                        answers.map(item=> (
                            <View
                                style={{
                                    marginTop: 20,
                                    backgroundColor: '#fff',
                                    paddingTop: 10,
                                    paddingLeft: 20,
                                    paddingRight: 10,
                                    paddingBottom: 10
                                }}
                            >
                                <TouchableOpacity
                                    onPress={()=> {
                                        info = item.userInfo;
                                        navigate('userDisp', info);
                                    }}
                                >
                                    <Image 
                                            source={
                                                item.userInfo.photo?
                                                {uri: item.userInfo.photo}:
                                                require('./images/user.png')
                                            }
                                            style={{
                                                height: 50,
                                                width: 50
                                            }} 
                                        />
                                    <Text
                                        style={{
                                            color: '#999',
                                            marginTop: -30,
                                            marginLeft: 60
                                        }}
                                    >
                                        Submited By: - {item.userInfo.name}
                                    </Text>
                                </TouchableOpacity>
                                <Text
                                    style={{
                                        fontSize: 16,
                                        marginTop: 20,
                                        color: '#555'
                                    }}
                                    onPress={handlePress}
                                >
                                    {item.answer}
                                </Text>
                            </View>
                        ))
                    }
                </ScrollView>
            )
        }
        else if(fetched){
            return (
                <Text
                        style={{
                            fontSize: 16,
                            color: '#229'
                        }}
                    >
                        No Answers Yet !!!!
                </Text>
            )
        }
        else {
            return(
                <Loading />
            )
        }

    }
    const subAns = () => {
        if(!sub) {
            // updateSub(true);
            console.log(newAnswer);
        }
    }
    return (
        <View>
            <View
                style={{
                    marginTop: 20,
                    backgroundColor: '#fff',
                    paddingBottom: 10,
                    paddingTop: 20,
                    paddingLeft: 20,
                    paddingRight: 20
                }}
            >
                <TouchableOpacity
                    onPress={()=> {
                                info = ques.user;
                                navigate('userDisp', info);
                            }}
                >
                    <Image 
                            source={
                                ques.user.photo?
                                {uri: ques.user.photo}:
                                require('./images/user.png')
                            }
                            style={{
                                height: 50,
                                width: 50
                            }} 
                        />
                    <Text
                        style={{
                            color: '#999',
                            marginTop: -30,
                            marginLeft: 60
                        }}
                    >
                        Submited By: - {ques.user.name}
                    </Text>
                </TouchableOpacity>
                <Text
                    style={{
                        fontSize: 20,
                        marginTop: 30
                    }}
                >
                    {ques.question}
                </Text>
            </View>
            <ScrollView
                style={{
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingBottom: 50
                }}
            >
                <Answers ques={ques} />
            </ScrollView>
            <View 
                style={{
                    width: '100%'
                }}
            >
                <TextInput 
                    style= {{
                        backgroundColor: '#fff',
                        height: 50,
                        borderWidth: 1,
                        paddingLeft: 10,
                        paddingRight: 10
                    }}
                    variant='outlined' 
                    placeholder= "Enter your Answer here..."
                    value={newAnswer}
                    onChangeText={(text)=> {updateNewAns(text)}}
                />
                <Button onPress= {subAns} title="Submit Answer" />
            </View>
        </View>
    );
}